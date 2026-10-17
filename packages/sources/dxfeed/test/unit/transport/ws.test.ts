import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { transport as priceWsTransport } from '../../../src/transport/price-ws'
import { transport as stockQuotesTransport } from '../../../src/transport/stock-quotes'
import {
  DxLinkMessage,
  dxLinkConnectionOptions,
  openDxLinkConnection,
} from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The feed logs via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

type Listener = (event: { data?: unknown; code?: number }) => void

/**
 * Fake connection with listener bookkeeping: exposes the listenerCount the
 * proving assertions need, on top of the add/remove/send surface the open gate
 * uses (the framework's ws client implements removeEventListener the same way).
 */
const makeConnection = () => {
  const sent: DxLinkMessage[] = []
  const listeners = new Map<string, Set<Listener>>()
  return {
    sent,
    send: (data: string) => sent.push(JSON.parse(data)),
    // The underlying ws client's close: the CHANNEL_CLOSED assertions spy it to
    // prove the in-band channel close never tears the socket down
    close: jest.fn(),
    addEventListener: (event: 'message' | 'close', listener: Listener) => {
      const set = listeners.get(event) ?? new Set<Listener>()
      set.add(listener)
      listeners.set(event, set)
    },
    removeEventListener: (event: 'message' | 'close', listener: Listener) => {
      listeners.get(event)?.delete(listener)
    },
    listenerCount: (event: 'message' | 'close') => listeners.get(event)?.size ?? 0,
    emit: (frame: DxLinkMessage | string) => {
      for (const listener of [...(listeners.get('message') ?? [])]) {
        listener({ data: typeof frame === 'string' ? frame : JSON.stringify(frame) })
      }
    },
    emitClose: (code = 1006) => {
      for (const listener of [...(listeners.get('close') ?? [])]) {
        listener({ code })
      }
    },
  }
}

const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

describe('open handler emits the dxLink handshake and resolves only on FEED_CONFIG (spec primary_command)', () => {
  it('sends SETUP, CHANNEL_REQUEST, FEED_SETUP in order with the spec message shapes', async () => {
    const connection = makeConnection()
    const opened = (stockQuotesTransport as any).config.handlers.open(connection, {
      adapterSettings: {},
    })
    connection.emit(frames.quoteFeedConfig)
    await opened

    expect(connection.sent.map((m) => m.type)).toEqual(['SETUP', 'CHANNEL_REQUEST', 'FEED_SETUP'])

    const [setup, channelRequest, feedSetup] = connection.sent
    // Spec primary_command message 1
    expect(setup).toEqual({
      type: 'SETUP',
      channel: 0,
      version: '0.1-js/1.0.0',
      keepaliveTimeout: 60,
      acceptKeepaliveTimeout: 60,
    })
    // Spec primary_command message 2 — the FEED channel id stays on the
    // transport instance (channel 1)
    expect(channelRequest).toEqual({
      type: 'CHANNEL_REQUEST',
      channel: 1,
      service: 'FEED',
      parameters: { contract: 'AUTO' },
    })
    // Spec primary_command message 3 — COMPACT format and the ticket field lists
    expect(feedSetup).toEqual({
      type: 'FEED_SETUP',
      channel: 1,
      acceptAggregationPeriod: 1,
      acceptDataFormat: 'COMPACT',
      acceptEventFields: {
        Quote: frames.quoteFeedConfig.eventFields.Quote,
        Trade: frames.priceFeedConfig.eventFields.Trade,
        TradeETH: frames.priceFeedConfig.eventFields.TradeETH,
      },
    })
  })

  it('stays pending until FEED_CONFIG arrives, then resolves', async () => {
    const connection = makeConnection()
    const opened = (stockQuotesTransport as any).config.handlers.open(connection, {
      adapterSettings: {},
    })

    connection.emit(frames.keepaliveFrame)
    expect(
      await Promise.race([
        opened.then(() => 'resolved' as const),
        Promise.resolve().then(() => 'pending' as const),
      ]),
    ).toBe('pending')

    connection.emit(frames.quoteFeedConfig)
    await expect(opened).resolves.toBeUndefined()
  })
})

describe('Authorization header is Basic base64(API_USERNAME:API_PASSWORD) (spec data_source_authentication.usage.handshake_header)', () => {
  it('is built by the transport options() hook from the adapter settings', () => {
    expect(
      (stockQuotesTransport as any).config.options({
        adapterSettings: { API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' },
      }),
    ).toEqual({
      headers: {
        Authorization: `Basic ${Buffer.from('dxfeed-user:dxfeed-pass').toString('base64')}`,
      },
    })

    expect(
      dxLinkConnectionOptions({ API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' }),
    ).toEqual({
      headers: {
        Authorization: `Basic ${Buffer.from('dxfeed-user:dxfeed-pass').toString('base64')}`,
      },
    })
  })
})

describe('customSubscriptionMessages emits FEED_SUBSCRIPTION add/remove per (symbol, eventType) (spec primary_command)', () => {
  it('adds the post-override Quote ticker on channel 1', () => {
    const messages = (stockQuotesTransport as any).config.builders.customSubscriptionMessages(
      {},
      { desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] },
    )
    expect(messages).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [{ symbol: 'AAPL:USLF24', type: 'Quote' }],
      },
    ])
  })

  it('removes a stale ticker with the matching (symbol, eventType) entry', () => {
    const messages = (stockQuotesTransport as any).config.builders.customSubscriptionMessages(
      {},
      { desired: [], new: [], stale: [{ ...QUOTE_PARAMS, base: 'TSLA' }] },
    )
    expect(messages).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        remove: [{ symbol: 'TSLA', type: 'Quote' }],
      },
    ])
  })

  it('adds both Trade and TradeETH entries for an :USLF24 price ticker (owner decision match_reference)', () => {
    const messages = (priceWsTransport as any).config.builders.customSubscriptionMessages(
      {},
      {
        desired: [{ base: 'AAPL:USLF24', quote: 'USD' }],
        new: [{ base: 'AAPL:USLF24', quote: 'USD' }],
        stale: [],
      },
    )
    expect(messages).toEqual([
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
})

describe('handlers.message parses COMPACT FEED_DATA and filters control frames (spec sample_response)', () => {
  const openFeed = async () => {
    const connection = makeConnection()
    const opened = (stockQuotesTransport as any).config.handlers.open(connection, {
      adapterSettings: {},
    })
    connection.emit(frames.quoteFeedConfig)
    await opened
    ;(stockQuotesTransport as any).config.builders.customSubscriptionMessages(
      {},
      { desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] },
    )
  }

  it('parses the spec Quote frame to the mapped fields, serving the newest record of the aggregated frame', async () => {
    await openFeed()

    const results = (stockQuotesTransport as any).config.handlers.message(frames.stockQuotesFrame)

    expect(results).toHaveLength(1)
    // The transport wraps the raw result as {params, response}
    expect(results[0].params).toEqual(QUOTE_PARAMS)
    // The spec sample frame concatenates two records; the LAST one is the
    // freshest quote: mid 190, bid 189.90/50, ask 190.10/80
    expect(results[0].response.data).toEqual({
      mid_price: 190.0,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    // Spec stock_quotes data_freshness.timestamp_field = time
    expect(results[0].response.timestamps).toEqual({
      providerIndicatedTimeUnixMs: 1760000001000,
    })
  })

  it('maps the JSON string "NaN" to an invalid (502) result', async () => {
    await openFeed()

    const results = (stockQuotesTransport as any).config.handlers.message(
      frames.stockQuotesInvalidFrame,
    )
    expect(results).toHaveLength(1)
    expect(results[0].response.statusCode).toBe(502)
    expect(results[0].response.errorMessage).toContain('invalid')
  })

  it('emits no data for ERROR, KEEPALIVE and CHANNEL_CLOSED frames', async () => {
    await openFeed()

    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect((stockQuotesTransport as any).config.handlers.message(frame)).toEqual([])
    }
  })
})

describe('open-gate listener lifetime (round-2 item 2: the transport handler is the sole frame parser after open)', () => {
  it('leaves exactly the transport message listener registered once the open gate resolves', async () => {
    const connection = makeConnection()

    // The framework registers its message handler before running handlers.open
    const transportMessageHandler = jest.fn()
    const transportCloseHandler = jest.fn()
    connection.addEventListener('message', transportMessageHandler)
    connection.addEventListener('close', transportCloseHandler)
    expect(connection.listenerCount('message')).toBe(1)

    const opened = openDxLinkConnection(connection)
    // The open gate added one 'message' listener and one 'close' listener
    expect(connection.listenerCount('message')).toBe(2)
    expect(connection.listenerCount('close')).toBe(2)

    connection.emit(frames.quoteFeedConfig)
    await expect(opened).resolves.toBeUndefined()

    // The open-gate listeners are gone: the transport handler is the sole
    // 'message' listener, and no open-gate 'close' listener remains
    expect(connection.listenerCount('message')).toBe(1)
    expect(connection.listenerCount('close')).toBe(1)
  })

  it('parses a later frame exactly once — no second parse by a leftover open-gate listener', async () => {
    const connection = makeConnection()

    // The framework's message handler parses every frame it receives
    const transportMessageHandler = jest.fn((event: { data?: unknown }) =>
      JSON.parse(String(event.data)),
    )
    connection.addEventListener('message', transportMessageHandler)

    const parseSpy = jest.spyOn(JSON, 'parse')
    try {
      const opened = openDxLinkConnection(connection)
      connection.emit(frames.quoteFeedConfig)
      await expect(opened).resolves.toBeUndefined()

      // The handshake frame itself reached the transport handler once; only the
      // post-handshake frames are counted below
      parseSpy.mockClear()
      transportMessageHandler.mockClear()

      // A post-handshake frame: parsed once for the transport handler, not a
      // second time by the open-gate listener
      connection.emit(frames.keepaliveFrame)
      expect(parseSpy).toHaveBeenCalledTimes(1)
      expect(transportMessageHandler).toHaveBeenCalledTimes(1)

      connection.emit(frames.keepaliveFrame)
      expect(parseSpy).toHaveBeenCalledTimes(2)
      expect(transportMessageHandler).toHaveBeenCalledTimes(2)
    } finally {
      parseSpy.mockRestore()
    }
  })

  it('removes the open-gate close listener too, so a post-handshake close reaches only the framework', async () => {
    const connection = makeConnection()
    const transportCloseHandler = jest.fn()
    connection.addEventListener('close', transportCloseHandler)

    const opened = openDxLinkConnection(connection)
    connection.emit(frames.quoteFeedConfig)
    await expect(opened).resolves.toBeUndefined()

    // The gate's close listener is gone; the framework's own close handler
    // still fires (post-handshake closes are framework business)
    expect(() => connection.emitClose()).not.toThrow()
    expect(transportCloseHandler).toHaveBeenCalledTimes(1)
  })
})

describe('CHANNEL_CLOSED is an in-band dxLink message (no error result, no reconnect)', () => {
  it('handlers.message emits no result, never closes the socket and never re-runs the handshake', async () => {
    const connection = makeConnection()

    // Open the real transport handlers against the fake connection: the dxLink
    // handshake (SETUP, CHANNEL_REQUEST, FEED_SETUP) goes out exactly once
    const opened = (stockQuotesTransport as any).config.handlers.open(connection, {
      adapterSettings: {},
    })
    connection.emit(frames.quoteFeedConfig)
    await opened
    const handshakeCount = connection.sent.length
    expect(handshakeCount).toBe(3)

    // The provider closes the dxLink feed channel in-band; the WebSocket
    // itself stays open
    const results = (stockQuotesTransport as any).config.handlers.message(
      frames.channelClosedFrame as any,
    )

    // (a) no result at all is emitted — in particular no error result
    expect(results).toEqual([])

    // (b) no reconnect: the socket is not closed and no re-handshake is sent —
    // the cached last value keeps serving across the channel-close window
    expect(connection.close).not.toHaveBeenCalled()
    expect(connection.sent).toHaveLength(handshakeCount)
  })
})
