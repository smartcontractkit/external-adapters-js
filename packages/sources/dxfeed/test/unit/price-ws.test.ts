import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { DxLinkFeed, DxLinkFeedDeps, DxLinkMessage, DxLinkRecord } from '../../src/dxlink/protocol'
import { buildPriceWsTransport, TradeProcessor, tradeTickers } from '../../src/transport/price-ws'
import frames from './fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

const PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

// Spec price sample_response FEED_CONFIG field layout: index 2 = time, 3 = price
const tradeRecord = (time: number, price: number) => [
  'Trade',
  'AAPL:USLF24',
  time,
  price,
  10,
  12345,
  'V',
  0.12,
  5000000,
  999000000,
  'UP',
  false,
]
// Same COMPACT layout for the extended-hours event type
const tradeEthRecord = (time: number, price: number) => [
  'TradeETH',
  'AAPL:USLF24',
  time,
  price,
  10,
  12345,
  'V',
  0.12,
  5000000,
  999000000,
  'UP',
  true,
]
const tradeFrame = (time: number, price: number) => ({
  type: 'FEED_DATA',
  channel: 1,
  data: ['Trade', tradeRecord(time, price)],
})
const tradeEthFrame = (time: number, price: number) => ({
  type: 'FEED_DATA',
  channel: 1,
  data: ['TradeETH', tradeEthRecord(time, price)],
})

type Listener = (event: { data?: unknown; code?: number }) => void

/** Minimal fake connection capturing the handshake frames the open gate sends. */
const makeConnection = () => {
  const sent: DxLinkMessage[] = []
  const listeners = new Map<string, Set<Listener>>()
  return {
    sent,
    send: (data: string) => sent.push(JSON.parse(data)),
    addEventListener: (event: 'message' | 'close', listener: Listener) => {
      const set = listeners.get(event) ?? new Set<Listener>()
      set.add(listener)
      listeners.set(event, set)
    },
    removeEventListener: (event: 'message' | 'close', listener: Listener) => {
      listeners.get(event)?.delete(listener)
    },
    emit: (frame: unknown) => {
      for (const listener of [...(listeners.get('message') ?? [])]) {
        listener({ data: JSON.stringify(frame) })
      }
    },
  }
}

/** Resolves 'pending' for an unsettled promise, else its settled state. */
const settledState = (p: Promise<unknown>) =>
  Promise.race([
    p.then(
      () => 'resolved' as const,
      () => 'rejected' as const,
    ),
    Promise.resolve().then(() => 'pending' as const),
  ])

const OPEN_CONTEXT = { adapterSettings: {} } as any

// The framework invokes customSubscriptionMessages with the desired set on every
// background execution BEFORE frames arrive; feed.message fans FEED_DATA records
// out only through the wire keys the builder registered, so a transport-driven
// test must run the same two steps in the same order.
const registerSubs = (transport: unknown, params: unknown): void => {
  ;(
    transport as {
      config: { builders: { customSubscriptionMessages: (c: unknown, s: unknown) => unknown } }
    }
  ).config.builders.customSubscriptionMessages({}, { desired: [params], new: [params], stale: [] })
}
const unsubscribeSubs = (transport: unknown, params: unknown): void => {
  ;(
    transport as {
      config: { builders: { customSubscriptionMessages: (c: unknown, s: unknown) => unknown } }
    }
  ).config.builders.customSubscriptionMessages({}, { desired: [], new: [], stale: [params] })
}
const transportMessage = (transport: unknown, frame: unknown): any[] =>
  (
    transport as { config: { handlers: { message: (m: unknown) => any[] } } }
  ).config.handlers.message(frame)

describe('TradeProcessor unsubscribe cleanup (round-2: newest-time state must not survive unsubscribe)', () => {
  it('subscribe symbol A, receive a Trade, unsubscribe A: latestTimeBySymbol has no entry for A', () => {
    const processor = new TradeProcessor()

    // Subscribe + a provider Trade (spec sample price 189.98 at t=1760000000000)
    expect(
      processor.processRecord('Trade', tradeRecord(1760000000000, 189.98), PARAMS as any)?.result,
    ).toBe(189.98)
    expect(processor.latestTimeBySymbol['AAPL:USLF24']).toBe(1760000000000)

    // The remove path of customSubscriptionMessages: the last subscription for
    // the wire key is gone
    processor.unsubscribe([{ symbol: 'AAPL:USLF24', type: 'Trade' }])

    expect(processor.latestTimeBySymbol).not.toHaveProperty('AAPL:USLF24')
  })

  it('clears the state for both subscribed event types of a :USLF24 symbol (Trade AND TradeETH), matching the tradeTickers entries', () => {
    const processor = new TradeProcessor()
    processor.processRecord('Trade', tradeRecord(2000, 189.98), PARAMS as any)
    processor.processRecord('TradeETH', tradeRecord(2500, 190.02), PARAMS as any)
    expect(Object.keys(processor.latestTimeBySymbol)).toEqual(['AAPL:USLF24'])

    processor.unsubscribe([
      { symbol: 'AAPL:USLF24', type: 'Trade' },
      { symbol: 'AAPL:USLF24', type: 'TradeETH' },
    ])

    expect(processor.latestTimeBySymbol).not.toHaveProperty('AAPL:USLF24')
  })

  it('resubscription after unsubscribe starts the newest-time state fresh', () => {
    const processor = new TradeProcessor()
    processor.processRecord('Trade', tradeRecord(2000, 189.98), PARAMS as any)
    processor.unsubscribe([{ symbol: 'AAPL:USLF24', type: 'Trade' }])

    // An older record after a fresh resubscription is served — there is no
    // carried-over newest time to drop it against
    expect(processor.processRecord('Trade', tradeRecord(1000, 189.95), PARAMS as any)?.result).toBe(
      189.95,
    )
  })
})

describe('price WS transport remove path (the cleanup is wired into customSubscriptionMessages, not just the processor)', () => {
  it('subscribe A, receive a Trade, unsubscribe A, resubscribe A: an older Trade is served again because the remove path deleted the newest-time state', () => {
    const transport = buildPriceWsTransport()
    transportMessage(transport, frames.priceFeedConfig)
    registerSubs(transport, PARAMS)

    // The newest Trade (t=2000) is served; an older one (t=1000) is dropped
    // against the newest-time state while the subscription is live
    expect(transportMessage(transport, tradeFrame(2000, 189.98))).toHaveLength(1)
    expect(transportMessage(transport, tradeFrame(1000, 189.95))).toEqual([])

    // Unsubscribe A (desired: [], stale: [A]) — the remove path fires the cleanup
    unsubscribeSubs(transport, PARAMS)

    // Resubscribe A: the stale-record guard starts fresh, so the t=1000 Trade
    // is served — proof the entry was deleted on unsubscribe
    registerSubs(transport, PARAMS)
    const older = transportMessage(transport, tradeFrame(1000, 189.95))
    expect(older).toHaveLength(1)
    expect(older[0].response.result).toBe(189.95)
    expect(older[0].response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1000 })
  })
})

describe('price WS transport handshake (spec primary_command over the price transport; open gate must fit WS_CONNECTION_OPEN_TIMEOUT)', () => {
  it('sends SETUP, CHANNEL_REQUEST, FEED_SETUP in order and open resolves only after FEED_CONFIG', async () => {
    const transport = buildPriceWsTransport()
    const connection = makeConnection()

    const opened = (transport as any).config.handlers.open(connection, OPEN_CONTEXT)

    expect(connection.sent.map((m: DxLinkMessage) => m.type)).toEqual([
      'SETUP',
      'CHANNEL_REQUEST',
      'FEED_SETUP',
    ])

    // Non-FEED_CONFIG frames during the handshake do not settle the open gate
    connection.emit(frames.keepaliveFrame)
    expect(await settledState(opened)).toBe('pending')

    connection.emit(frames.priceFeedConfig)
    await expect(opened).resolves.toBeUndefined()
  })
})

describe('price WS transport Authorization header (spec data_source_authentication.usage.handshake_header)', () => {
  it('options() returns { headers: { Authorization: Basic base64(API_USERNAME:API_PASSWORD) } }', () => {
    const transport = buildPriceWsTransport()
    expect(
      (transport as any).config.options({
        adapterSettings: { API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' },
      }),
    ).toEqual({
      headers: {
        Authorization: `Basic ${Buffer.from('dxfeed-user:dxfeed-pass').toString('base64')}`,
      },
    })
  })
})

describe('price WS transport subscription messages and heartbeat (spec primary_command FEED_SUBSCRIPTION; keepalive interval_seconds=30)', () => {
  it('subscribe emits FEED_SUBSCRIPTION add, unsubscribe emits remove, and a simulated reconnect re-sends the whole desired set', () => {
    const transport = buildPriceWsTransport()
    const builder = (transport as any).config.builders.customSubscriptionMessages.bind(transport)

    const uslf = { base: 'AAPL:USLF24', quote: 'USD' }
    const EXPECTED_ADD = [
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ],
      },
    ]

    // Subscribe: add per (symbol, eventType)
    expect(builder({}, { desired: [uslf], new: [uslf], stale: [] })).toEqual(EXPECTED_ADD)

    // Unsubscribe: the wire keys are no longer desired
    expect(builder({}, { desired: [], new: [], stale: [uslf] })).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        remove: [
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ],
      },
    ])

    // Reconnect: the framework re-delivers the whole desired set as `new` and
    // the builder must re-send every (symbol, eventType) entry
    expect(builder({}, { desired: [uslf], new: [uslf], stale: [] })).toEqual(EXPECTED_ADD)
  })

  it('handlers.heartbeat sends exactly the dxLink KEEPALIVE frame on channel 0', () => {
    const transport = buildPriceWsTransport()
    const send = jest.fn()

    ;(transport as any).config.handlers.heartbeat({ send })

    expect(send).toHaveBeenCalledTimes(1)
    expect(JSON.parse(send.mock.calls[0][0])).toEqual({ type: 'KEEPALIVE', channel: 0 })
  })
})

describe('Trade and TradeETH newest-time selection (spec price description: when both event types arrive, serve the record with the newest time)', () => {
  it('serves the newest of the two event types and drops strictly older latecomers', () => {
    const processor = new TradeProcessor()

    // Spec price sample Trade: 189.98 at t=1760000000000
    expect(
      processor.processRecord('Trade', tradeRecord(1760000000000, 189.98), PARAMS as any)?.result,
    ).toBe(189.98)

    // A later TradeETH record is served with its own time
    const eth = processor.processRecord(
      'TradeETH',
      tradeEthRecord(1760000000500, 190.02),
      PARAMS as any,
    )
    expect(eth?.result).toBe(190.02)
    expect(eth?.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000500 })

    // A strictly older record arriving after a newer one is dropped (reference
    // semantics: only strictly older records are ignored; equal time is served)
    expect(
      processor.processRecord('Trade', tradeRecord(1760000000100, 189.99), PARAMS as any),
    ).toBeUndefined()

    // A newer record is served again
    expect(
      processor.processRecord('Trade', tradeRecord(1760000001000, 190.04), PARAMS as any)?.result,
    ).toBe(190.04)
  })

  it('a :USLF24 symbol subscribes both event types; a bare symbol subscribes Trade only (owner decision match_reference)', () => {
    expect(tradeTickers('AAPL:USLF24')).toEqual([
      { symbol: 'AAPL:USLF24', type: 'Trade' },
      { symbol: 'AAPL:USLF24', type: 'TradeETH' },
    ])
    expect(tradeTickers('SPCX')).toEqual([{ symbol: 'SPCX', type: 'Trade' }])
  })
})

describe('shared newest-time state across Trade and TradeETH (plan tradeprocessor-shared-newest-time-key: the per-symbol newest-time entry is deleted only when no desired subscription remains for the symbol across BOTH Trade and TradeETH wire keys)', () => {
  it('unsubscribes Trade while TradeETH stays desired: an older TradeETH record is still filtered and the last value is unchanged', () => {
    const processor = new TradeProcessor()
    const feed = new DxLinkFeed({
      // formatTickers stub mapping each params onto exactly the entries it
      // names, so a Trade-only removal can be expressed against a
      // still-desired TradeETH key on the same symbol
      formatTickers: (params: any) => params.entries,
      processRecord: (eventType, record, params) =>
        processor.processRecord(eventType, record, params as any),
    } as DxLinkFeedDeps<any>)
    feed.onFeedConfig(frames.priceFeedConfig.eventFields)

    const tradeOnly = { entries: [{ symbol: 'AAPL:USLF24', type: 'Trade' }] }
    const ethOnly = { entries: [{ symbol: 'AAPL:USLF24', type: 'TradeETH' }] }
    feed.subscriptionMessages({
      desired: [tradeOnly, ethOnly],
      new: [tradeOnly, ethOnly],
      stale: [],
    })

    // The newest TradeETH (t=2500) is served and becomes the shared newest time
    const served = feed.message(tradeEthFrame(2500, 190.02))
    expect(served).toHaveLength(1)
    expect((served[0] as any).result).toBe(190.02)
    expect(processor.latestTimeBySymbol['AAPL:USLF24']).toBe(2500)

    // Unsubscribe Trade ONLY — TradeETH remains desired for the symbol, so the
    // wire frame still carries the Trade remove entry
    const messages = feed.subscriptionMessages({
      desired: [ethOnly],
      new: [],
      stale: [tradeOnly],
    })
    expect(messages).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        remove: [{ symbol: 'AAPL:USLF24', type: 'Trade' }],
      },
    ])

    // A TradeETH record OLDER than the last served time is still filtered, and
    // the last value is unchanged — the shared newest-time entry survived the
    // Trade-only unsubscribe
    expect(feed.message(tradeEthFrame(1000, 189.0))).toEqual([])
    expect(processor.latestTimeBySymbol['AAPL:USLF24']).toBe(2500)
  })

  it('unsubscribes BOTH wire keys: the shared entry is deleted and a later resubscription starts fresh', () => {
    const processor = new TradeProcessor()
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => tradeTickers(params.base),
      processRecord: (eventType, record, params) =>
        processor.processRecord(eventType, record, params as any),
      // The real transport wires the remove path to the processor
      // (buildPriceWsTransport); the stub mirrors that wiring so this test
      // exercises the full symbol-level cleanup
      onUnsubscribe: (entries) => processor.unsubscribe(entries),
    } as DxLinkFeedDeps<any>)
    feed.onFeedConfig(frames.priceFeedConfig.eventFields)

    feed.subscriptionMessages({ desired: [PARAMS], new: [PARAMS], stale: [] })
    expect(feed.message(tradeEthFrame(2500, 190.02))).toHaveLength(1)
    expect(processor.latestTimeBySymbol['AAPL:USLF24']).toBe(2500)

    // Both wire keys go: the symbol has no desired subscription left on any
    // event type, so the shared newest-time entry is deleted
    feed.subscriptionMessages({ desired: [], new: [], stale: [PARAMS] })
    expect(processor.latestTimeBySymbol).not.toHaveProperty('AAPL:USLF24')
  })
})

describe('newest-time state keyed by the record eventSymbol verbatim (plan record-symbol-uppercase-keying: no upper-case normalisation on the record-symbol key; subscription keys keep their existing normalisation in tradeTickers)', () => {
  // Spec price COMPACT layout, eventSymbol (index 1) in mixed case exactly as a
  // provider wire-shape regression would deliver it
  const mixedCaseRecord = (time: number, price: number): DxLinkRecord => [
    'Trade',
    'aapl:UsLf24',
    time,
    price,
    10,
    12345,
    'V',
    0.12,
    5000000,
    999000000,
    'UP',
    false,
  ]

  it('dedupes against the same mixed-case symbol: the state is keyed exactly as received, an equal-time record is served, an older record is dropped', () => {
    const processor = new TradeProcessor()

    // The first mixed-case record is served and keyed by the symbol AS RECEIVED
    // (no upper-casing on the newest-time key)
    expect(
      processor.processRecord('Trade', mixedCaseRecord(2000, 189.98), PARAMS as any)?.result,
    ).toBe(189.98)
    expect(processor.latestTimeBySymbol['aapl:UsLf24']).toBe(2000)

    // An equal-time record is served (reference semantics: only strictly older
    // records are ignored)
    expect(
      processor.processRecord('Trade', mixedCaseRecord(2000, 189.99), PARAMS as any)?.result,
    ).toBe(189.99)

    // An older record is dropped against the same mixed-case key
    expect(
      processor.processRecord('Trade', mixedCaseRecord(1000, 188.0), PARAMS as any),
    ).toBeUndefined()
    expect(processor.latestTimeBySymbol['aapl:UsLf24']).toBe(2000)
  })
})
