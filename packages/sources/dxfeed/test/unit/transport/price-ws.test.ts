import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import * as priceWs from '../../../src/transport/price-ws'
import {
  buildPriceWsTransport,
  TradeProcessor,
  tradeTickers,
} from '../../../src/transport/price-ws'
import type { DxLinkMessage, DxLinkRecord } from '../../../src/transport/ws'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The transport module logs via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

const PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

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

// WS_CONNECTION_OPEN_TIMEOUT unset: the open gate runs without the timeout race
const OPEN_CONTEXT = { adapterSettings: {} } as any

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
const tradeEthRecord = (time: number, price: number) => [
  'TradeETH',
  'AAPL:USLF24',
  time,
  price,
  5,
  12346,
  'V',
  0.13,
  5000001,
  999000001,
  'DOWN',
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
const transportMessage = (transport: unknown, frame: unknown): any[] =>
  (
    transport as { config: { handlers: { message: (m: unknown) => any[] } } }
  ).config.handlers.message(frame)

/** Brings a transport to the post-handshake, subscribed state (FEED_CONFIG then the desired set). */
const connectedTransport = (transport: unknown, params: unknown): unknown => {
  transportMessage(transport, frames.priceFeedConfig)
  registerSubs(transport, params)
  return transport
}

describe('TradeProcessor newest-time state (round-2 item 4: state is per transport instance, not a module singleton)', () => {
  it('exports no module-level tradeProcessor singleton', () => {
    // The former shared singleton leaked newest-time state across transport
    // instances; the module must not export one
    expect((priceWs as unknown as Record<string, unknown>).tradeProcessor).toBeUndefined()
  })

  it('Trade wins over TradeETH only when its time is newer within the same instance', () => {
    const processor = new TradeProcessor()

    // TradeETH is newest at t=2000
    expect(
      processor.processRecord('TradeETH', tradeEthRecord(2000, 190.02), PARAMS as any)?.result,
    ).toBe(190.02)

    // An older regular-hours Trade at t=1500 loses to the TradeETH time
    expect(
      processor.processRecord('Trade', tradeRecord(1500, 189.98), PARAMS as any),
    ).toBeUndefined()

    // A strictly newer Trade at t=2500 wins over the TradeETH
    expect(processor.processRecord('Trade', tradeRecord(2500, 189.99), PARAMS as any)?.result).toBe(
      189.99,
    )

    // Reference semantics: an equal-time record is served like the newest one
    expect(
      processor.processRecord('TradeETH', tradeEthRecord(2500, 190.5), PARAMS as any)?.result,
    ).toBe(190.5)
  })

  it('non-Trade/TradeETH event types produce no result and no newest-time state', () => {
    const processor = new TradeProcessor()
    expect(
      processor.processRecord('Quote', ['Quote', 'AAPL:USLF24', 2000, 1, 2], PARAMS as any),
    ).toBeUndefined()
    // ...so a later Trade at an older time is still the newest Trade seen
    expect(processor.processRecord('Trade', tradeRecord(1000, 189.98), PARAMS as any)?.result).toBe(
      189.98,
    )
  })
})

describe('per-transport newest-time state (round-2 item 4 proving test: buildPriceWsTransport constructs a TradeProcessor per transport)', () => {
  it('two transport instances keep independent newest-time state per symbol', () => {
    const first = connectedTransport(buildPriceWsTransport(), PARAMS)
    const second = connectedTransport(buildPriceWsTransport(), PARAMS)

    // Instance A sees a Trade at t=2000 (spec sample price 189.98)
    const firstTrade = transportMessage(first, tradeFrame(2000, 189.98))
    expect(firstTrade).toHaveLength(1)
    expect(firstTrade[0].response.result).toBe(189.98)
    expect(firstTrade[0].params.base).toBe('AAPL:USLF24')

    // Instance B's first record — a TradeETH at t=1000 — is NOT dropped by
    // instance A's newer time: the transports share no newest-time state
    const secondTradeEth = transportMessage(second, tradeEthFrame(1000, 190.02))
    expect(secondTradeEth).toHaveLength(1)
    expect(secondTradeEth[0].response.result).toBe(190.02)

    // Within instance A the same TradeETH at t=1000 IS older than t=2000: dropped
    expect(transportMessage(first, tradeEthFrame(1000, 190.02))).toEqual([])
  })

  it('the exported transport maps the spec sample Trade frame through its own processor', () => {
    // FEED_CONFIG first (the provider echoes the requested layout back), then the
    // spec sample Trade frame (t=1760000000000, price 189.98) maps to the spec
    // endpoint_request_response_examples[1].response
    const results = transportMessage(
      connectedTransport(priceWs.transport, PARAMS),
      frames.priceTradeFrame,
    )

    expect(results).toHaveLength(1)
    expect(results[0].response.result).toBe(189.98)
    expect(results[0].response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('serves a NaN trade price as an invalid (502) result carrying the record time', () => {
    const processor = new TradeProcessor()
    const invalid = processor.processRecord(
      'Trade',
      tradeRecord(1760000000000, NaN),
      PARAMS as any,
    ) as any

    expect(invalid.statusCode).toBe(502)
    expect(invalid.errorMessage).toContain('invalid')
    expect(invalid.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })
})

describe('newest-time state keyed by the record eventSymbol (plan item: one dedupe state per wire symbol, not per params.base)', () => {
  // Two params sets whose bases differ only in casing: formatTickers maps both
  // onto ONE wire key (Trade:AAPL:USLF24), so one provider stream serves both
  const UPPER = { base: 'AAPL:USLF24', quote: 'USD' }
  const LOWER = { base: 'aapl:uslf24', quote: 'USD' }

  const sharedKeyTradeFeed = () => {
    const processor = new TradeProcessor()
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => tradeTickers(params.base),
      processRecord: (eventType, record, params: any) =>
        processor.processRecord(eventType, record, params),
    } as DxLinkFeedDeps<any>)
    feed.onFeedConfig(frames.priceFeedConfig.eventFields)
    feed.subscriptionMessages({ desired: [UPPER, LOWER], new: [UPPER, LOWER], stale: [] })
    return feed
  }

  it('both base casings resolve onto one wire key and one dedupe state: an older record after a newer one is served to NEITHER subscription', () => {
    const feed = sharedKeyTradeFeed()

    // The newest record (t=2000) fans out to both params sets
    const newer = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Trade', tradeRecord(2000, 189.99)],
    })
    expect(newer).toHaveLength(2)
    expect(newer.map((r) => (r as any).result)).toEqual([189.99, 189.99])

    // An older record (t=1000) arriving late: dropped against the shared
    // newest-time state, so NEITHER params set is served stale data
    const older = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Trade', tradeRecord(1000, 189.95)],
    })
    expect(older).toEqual([])
  })

  it('the dedupe key is the record eventSymbol itself, so state survives a params set churning', () => {
    const feed = sharedKeyTradeFeed()

    // A record for the wire symbol arrives while only ONE params set is desired
    feed.subscriptionMessages({ desired: [UPPER], new: [UPPER], stale: [] })
    expect(
      feed.message({ type: 'FEED_DATA', channel: 1, data: ['Trade', tradeRecord(2000, 189.99)] }),
    ).toHaveLength(1)

    // The second casing subscribes afterwards: the shared (already-seen) newest
    // time still drops the older record for it too
    feed.subscriptionMessages({ desired: [UPPER, LOWER], new: [LOWER], stale: [] })
    expect(
      feed.message({ type: 'FEED_DATA', channel: 1, data: ['Trade', tradeRecord(1000, 189.95)] }),
    ).toEqual([])

    // ...while a strictly newer record is served
    expect(
      feed.message({ type: 'FEED_DATA', channel: 1, data: ['Trade', tradeRecord(3000, 190.1)] }),
    ).toHaveLength(2)
  })
})

describe('invalid records do not advance the newest-time cursor (round-2: a malformed newer record must not suppress valid older records)', () => {
  it('valid Trade t1, invalid NaN-price Trade t2>t1, valid TradeETH t3 with t1<t3<t2: t3 is served', () => {
    const processor = new TradeProcessor()
    const T1 = 1760000000000
    const T2 = T1 + 1000
    const T3 = T1 + 500

    // t1: a valid Trade — served, cursor advances to t1
    expect(processor.processRecord('Trade', tradeRecord(T1, 189.98), PARAMS as any)?.result).toBe(
      189.98,
    )

    // t2: an invalid (NaN price) Trade — the 502 path, and the cursor does NOT
    // advance to t2
    const invalid = processor.processRecord('Trade', tradeRecord(T2, NaN), PARAMS as any) as any
    expect(invalid.statusCode).toBe(502)

    // t3: a valid TradeETH with t1 < t3 < t2 — SERVED, proving the invalid t2
    // record did not advance the cursor (the former code wrote the cursor
    // before the price check and dropped this record)
    expect(
      processor.processRecord('TradeETH', tradeEthRecord(T3, 190.02), PARAMS as any)?.result,
    ).toBe(190.02)
    expect(processor.latestTimeBySymbol['AAPL:USLF24']).toBe(T3)
  })
})

describe('the 502 result never carries a NaN or null providerIndicatedTimeUnixMs (round-2: nonnumeric time must not serialize NaN into a number-typed field)', () => {
  // Spec price Trade record layout with the time field (index 2) unusable and
  // the price (index 3) the JSON string "NaN" -> invalid. The time argument is
  // deliberately loose (the missing-time case feeds a hole at index 2, so the
  // literal widens to unknown[]), hence the assertion to the DxLinkRecord
  // wire-record type the COMPACT parser accepts.
  const tradeAt = (time: unknown): DxLinkRecord =>
    [
      'Trade',
      'AAPL:USLF24',
      time,
      'NaN',
      10,
      12345,
      'V',
      0.12,
      5000000,
      999000000,
      'UP',
      false,
    ] as DxLinkRecord

  it('a NaN-price Trade with a MISSING time field yields a 502 with no NaN/null provider timestamp', () => {
    const result = new TradeProcessor().processRecord(
      'Trade',
      // The time field (index 2) is absent from the COMPACT row
      tradeAt(undefined),
      PARAMS as any,
    ) as any

    expect(result.statusCode).toBe(502)
    expect(result.errorMessage).toContain('invalid')
    // "Include providerIndicatedTimeUnixMs only when the parsed time is
    // finite": a non-finite time means NO timestamps field at all — the field
    // is omitted, never a NaN or null number
    expect(result.timestamps).toBeUndefined()
  })

  it('a NaN-price Trade with a NONNUMERIC time yields a 502 with no NaN/null provider timestamp', () => {
    const result = new TradeProcessor().processRecord(
      'Trade',
      tradeAt('not-a-number'),
      PARAMS as any,
    ) as any

    expect(result.statusCode).toBe(502)
    // Same rule: the non-finite time is omitted, not NaN/null
    expect(result.timestamps).toBeUndefined()
  })

  it('a finite time still rides the 502 — freshness reporting keeps the provider timestamp of the record', () => {
    const result = new TradeProcessor().processRecord(
      'Trade',
      tradeAt(1760000000000),
      PARAMS as any,
    ) as any

    expect(result.statusCode).toBe(502)
    expect(result.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('a valid-price Trade with a nonnumeric time is served without a NaN provider timestamp (never emit NaN in a number-typed field)', () => {
    const processor = new TradeProcessor()
    const record: DxLinkRecord = [
      'Trade',
      'AAPL:USLF24',
      'not-a-number',
      189.98,
      10,
      12345,
      'V',
      0.12,
      5000000,
      999000000,
      'UP',
      false,
    ]
    const result = processor.processRecord('Trade', record, PARAMS as any) as any

    expect(result.statusCode).toBeUndefined()
    expect(result.result).toBe(189.98)
    // Served without a provider timestamp: the non-finite time is omitted,
    // never NaN/null in a number-typed field
    expect(result.timestamps).toBeUndefined()
  })
})

describe('price WS transport handshake sequence (spec primary_command: SETUP -> CHANNEL_REQUEST -> FEED_SETUP, open resolves only after FEED_CONFIG)', () => {
  it('sends the three spec primary_command handshake frames in order with their exact shapes', async () => {
    const transport = buildPriceWsTransport()
    const connection = makeConnection()

    const opened = (transport as any).config.handlers.open(connection, OPEN_CONTEXT)

    // Spec primary_command, in order: SETUP, CHANNEL_REQUEST, FEED_SETUP
    expect(connection.sent.map((m: DxLinkMessage) => m.type)).toEqual([
      'SETUP',
      'CHANNEL_REQUEST',
      'FEED_SETUP',
    ])
    const [setup, channelRequest, feedSetup] = connection.sent
    // Spec primary_command SETUP message
    expect(setup).toEqual({
      type: 'SETUP',
      channel: 0,
      version: '0.1-js/1.0.0',
      keepaliveTimeout: 60,
      acceptKeepaliveTimeout: 60,
    })
    // Spec primary_command CHANNEL_REQUEST message
    expect(channelRequest).toEqual({
      type: 'CHANNEL_REQUEST',
      channel: 1,
      service: 'FEED',
      parameters: { contract: 'AUTO' },
    })
    // Spec primary_command FEED_SETUP message
    expect(feedSetup).toMatchObject({
      type: 'FEED_SETUP',
      channel: 1,
      acceptAggregationPeriod: 1,
      acceptDataFormat: 'COMPACT',
    })

    // The open gate stays pending until the provider answers FEED_CONFIG
    connection.emit(frames.keepaliveFrame)
    expect(await settledState(opened)).toBe('pending')
    connection.emit(frames.priceFeedConfig)
    await expect(opened).resolves.toBeUndefined()
  })
})

describe('price WS transport auth header (spec data_source_authentication.usage.handshake_header: Authorization: Basic <base64(API_USERNAME:API_PASSWORD)>)', () => {
  it('options() returns the Basic Authorization header built from the credential pair, never a URL credential', () => {
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

describe('price WS transport FEED_SUBSCRIPTION frames (spec primary_command FEED_SUBSCRIPTION add/remove per (symbol, eventType))', () => {
  const uslfParams = { base: 'AAPL:USLF24', quote: 'USD' }
  const builder = (transport: unknown, subscriptions: unknown): DxLinkMessage[] =>
    (
      transport as {
        config: { builders: { customSubscriptionMessages: (c: unknown, s: unknown) => unknown } }
      }
    ).config.builders.customSubscriptionMessages({}, subscriptions) as DxLinkMessage[]

  it('subscribes both Trade and TradeETH entries for a :USLF24 symbol', () => {
    const transport = buildPriceWsTransport()
    expect(builder(transport, { desired: [uslfParams], new: [uslfParams], stale: [] })).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ],
      },
    ])
  })

  it('unsubscribes with FEED_SUBSCRIPTION remove entries for the same (symbol, eventType) keys', () => {
    const transport = buildPriceWsTransport()
    builder(transport, { desired: [uslfParams], new: [uslfParams], stale: [] })
    expect(builder(transport, { desired: [], new: [], stale: [uslfParams] })).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        remove: [
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ],
      },
    ])
  })
})

describe('price WS transport COMPACT parsing and control-frame filtering (spec price sample_response, acceptDataFormat=COMPACT)', () => {
  it('rejects a Trade price carried as the JSON string "NaN" as an invalid (502) result (spec valueRangeScalingNotes)', () => {
    const transport = connectedTransport(buildPriceWsTransport(), PARAMS)
    const nanFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Trade',
        [
          'Trade',
          'AAPL:USLF24',
          1760000000000,
          'NaN',
          10,
          12345,
          'V',
          0.12,
          5000000,
          999000000,
          'UP',
          false,
        ],
      ],
    }

    const results = transportMessage(transport, nanFrame)
    expect(results).toHaveLength(1)
    expect(results[0].response.statusCode).toBe(502)
    expect(results[0].response.errorMessage).toContain('invalid')
    expect(results[0].response.result).toBeUndefined()
  })

  it('truncates a trailing partial record: the complete record is served, the torn tail is not', () => {
    const transport = connectedTransport(buildPriceWsTransport(), PARAMS)
    // One complete 12-field Trade record followed by a torn 4-field tail
    const tornTailFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Trade',
        [
          ...frames.priceTradeFrame.data[1],
          // Torn second record: only 4 of the 12 fields arrived
          'Trade',
          'AAPL:USLF24',
          1760000001000,
          999.99,
        ],
      ],
    }

    const results = transportMessage(transport, tornTailFrame)
    expect(results).toHaveLength(1)
    // The COMPLETE record (spec sample: 189.98 at t=1760000000000) is served...
    expect(results[0].response.result).toBe(189.98)
    expect(results[0].response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
    // ...and the torn tail's values never surface as a result
    expect(results.some((r: any) => r.response.result === 999.99)).toBe(false)
  })

  it('produces no results for ERROR, KEEPALIVE and CHANNEL_CLOSED control frames (owner decision degraded_stream_alerting=metrics_counters_only)', () => {
    const transport = connectedTransport(buildPriceWsTransport(), PARAMS)
    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect(transportMessage(transport, frame)).toEqual([])
    }
  })
})
