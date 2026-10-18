import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { config } from '../../src/config'
import { TradeProcessor, tradeTickers } from '../../src/transport/price-ws'
import {
  quoteRecordToResult,
  transport as stockQuotesTransport,
} from '../../src/transport/stock-quotes'
import {
  DxLinkFeed,
  DxLinkFeedDeps,
  DxLinkMessage,
  dxLinkConnectionOptions,
  openDxLinkConnection,
} from '../../src/transport/ws'
import frames from './fixtures/dxlink-frames.json'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }
const TRADE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  // FEED_CONFIG field order first (the open gate hands this over), then the
  // subscription index (normally populated by the customSubscriptionMessages builder)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
  return feed
}

const tradeFeed = () => {
  // One processor per feed: newest-time state is per transport instance
  const processor = new TradeProcessor()
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => tradeTickers(params.base),
    processRecord: (eventType, record, params: any) =>
      processor.processRecord(eventType, record, params),
  } as DxLinkFeedDeps<any>)
  feed.onFeedConfig(frames.priceFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [TRADE_PARAMS], new: [TRADE_PARAMS], stale: [] })
  return feed
}

type TestConnection = {
  sent: DxLinkMessage[]
  send: (data: string) => void
  addEventListener: (
    event: 'message' | 'close',
    listener: (event: { data?: unknown; code?: number }) => void,
  ) => void
  emit: (frame: DxLinkMessage | string) => void
}

const makeConnection = (): TestConnection => {
  const sent: DxLinkMessage[] = []
  const listeners = new Map<
    string,
    ((event: { data?: unknown; code?: number }) => void) | undefined
  >()
  return {
    sent,
    send: (data: string) => sent.push(JSON.parse(data)),
    addEventListener: (
      event: 'message' | 'close',
      listener: (event: { data?: unknown; code?: number }) => void,
    ) => {
      listeners.set(event, listener)
    },
    emit: (frame: DxLinkMessage | string) =>
      listeners.get('message')?.({
        data: typeof frame === 'string' ? frame : JSON.stringify(frame),
      }),
  }
}

describe('Basic Authorization header (spec data_source_authentication.usage.handshake_header)', () => {
  it('is Basic base64(API_USERNAME:API_PASSWORD), on options() of the real transport', () => {
    // Spec usage: "Authorization: Basic <base64(API_USERNAME:API_PASSWORD)>"
    expect(
      dxLinkConnectionOptions({ API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' }),
    ).toEqual({
      headers: {
        Authorization: `Basic ${Buffer.from('dxfeed-user:dxfeed-pass').toString('base64')}`,
      },
    })

    // The transport wires options() to the adapter settings of the same names
    expect(
      (stockQuotesTransport as any).config.options({
        adapterSettings: { API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' },
      }),
    ).toEqual({
      headers: {
        Authorization: `Basic ${Buffer.from('dxfeed-user:dxfeed-pass').toString('base64')}`,
      },
    })
  })
})

describe('dxLink handshake open gate (spec primary_command)', () => {
  it('sends SETUP, CHANNEL_REQUEST, FEED_SETUP in order and resolves only on FEED_CONFIG', async () => {
    const connection = makeConnection()
    let captured: Record<string, string[]> | undefined
    const opened = openDxLinkConnection(connection, (fields) => (captured = fields))

    const [setup, channelRequest, feedSetup] = connection.sent
    // Spec primary_command message 1
    expect(setup).toEqual({
      type: 'SETUP',
      channel: 0,
      version: '0.1-js/1.0.0',
      keepaliveTimeout: 60,
      acceptKeepaliveTimeout: 60,
    })
    // Spec primary_command message 2
    expect(channelRequest).toEqual({
      type: 'CHANNEL_REQUEST',
      channel: 1,
      service: 'FEED',
      parameters: { contract: 'AUTO' },
    })
    // Spec primary_command message 3
    expect(feedSetup.channel).toBe(1)
    expect(feedSetup.acceptAggregationPeriod).toBe(1)
    expect(feedSetup.acceptDataFormat).toBe('COMPACT')
    expect(feedSetup.acceptEventFields?.Quote).toEqual(frames.quoteFeedConfig.eventFields.Quote)

    // The gate stays pending through non-FEED_CONFIG frames...
    connection.emit(frames.keepaliveFrame)
    const pending = await Promise.race([
      opened.then(() => 'resolved' as const),
      Promise.resolve().then(() => 'pending' as const),
    ])
    expect(pending).toBe('pending')

    // ...and resolves once FEED_CONFIG arrives, handing over the field layout
    connection.emit(frames.quoteFeedConfig)
    await expect(opened).resolves.toBeUndefined()
    expect(captured).toEqual({ Quote: frames.quoteFeedConfig.eventFields.Quote })
  })
})

describe('COMPACT FEED_DATA parsing (spec sample_response frames, acceptDataFormat=COMPACT)', () => {
  it('parses the Quote frame to typed quote records, serving the newest record of the aggregated frame (last record per wire key wins)', () => {
    const results = quoteFeed().message(frames.stockQuotesFrame as any)
    expect(results).toHaveLength(1)
    // The spec sample frame concatenates two records for the same wire key;
    // the LAST one is the freshest quote (time 1760000001000, bid 189.90/50,
    // ask 190.10/80, mid 190)
    expect((results[0] as any).data).toEqual({
      mid_price: 190,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    expect((results[0] as any).timestamps).toEqual({
      providerIndicatedTimeUnixMs: 1760000001000,
    })
  })

  it('parses the Trade frame to a typed trade record', () => {
    const results = tradeFeed().message(frames.priceTradeFrame as any)
    expect(results).toHaveLength(1)
    // Spec endpoint_request_response_examples[1].response
    expect((results[0] as any).result).toBe(189.98)
    expect((results[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('a "NaN" price yields an invalid (502) result, not a number', () => {
    const results = quoteFeed().message(frames.stockQuotesInvalidFrame as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).statusCode).toBe(502)
    expect((results[0] as any).errorMessage).toContain('invalid')
  })

  it('a trailing partial record is dropped', () => {
    const feed = quoteFeed()
    const partialFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Quote',
        [
          ...frames.stockQuotesFrame.data[1].slice(0, 9),
          // a second record missing its last 5 of 9 fields
          'Quote',
          'AAPL:USLF24',
          1760000002000,
          1,
        ],
      ],
    }
    const results = feed.message(partialFrame as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).data.bid_price).toBe(189.95)
  })

  it('ERROR, KEEPALIVE and CHANNEL_CLOSED frames emit no results', () => {
    const feed = quoteFeed()
    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect(feed.message(frame as any)).toEqual([])
    }
  })
})

describe('heartbeat (spec keepalive interval_seconds=30 / framework WS_HEARTBEAT_INTERVAL_MS)', () => {
  it('sends exactly the dxLink KEEPALIVE frame on channel 0', () => {
    const send = jest.fn()
    ;(stockQuotesTransport as any).config.handlers.heartbeat({ send })
    expect(send).toHaveBeenCalledTimes(1)
    expect(JSON.parse(send.mock.calls[0][0])).toEqual({ type: 'KEEPALIVE', channel: 0 })
  })

  it('pins the heartbeat cadence at the spec 30000ms default', () => {
    const oldEnv = process.env['WS_HEARTBEAT_INTERVAL_MS']
    delete process.env['WS_HEARTBEAT_INTERVAL_MS']
    try {
      config.initialize()
      expect(config.settings.WS_HEARTBEAT_INTERVAL_MS).toBe(30000)
    } finally {
      if (oldEnv !== undefined) {
        process.env['WS_HEARTBEAT_INTERVAL_MS'] = oldEnv
      }
      config.initialize()
    }
  })
})

describe('transport hook wiring (plan round1-ws-transport proving test: the real transport sends the handshake before open resolves, sends the FEED_SUBSCRIPTION add with the symbol, and emits parsed bid/ask through handlers.message)', () => {
  it('handlers.open sends SETUP, CHANNEL_REQUEST, FEED_SETUP through the real transport and resolves only on FEED_CONFIG', async () => {
    const connection = makeConnection()
    // The open hook is the framework's extension point: it runs the dxLink
    // open gate against the adapter settings' WS_CONNECTION_OPEN_TIMEOUT
    const opened = (stockQuotesTransport as any).config.handlers.open(connection, {
      adapterSettings: { WS_CONNECTION_OPEN_TIMEOUT: 10_000 },
    })

    // The three spec primary_command frames go out before the gate resolves
    expect(connection.sent.map(({ type }) => type)).toEqual([
      'SETUP',
      'CHANNEL_REQUEST',
      'FEED_SETUP',
    ])

    // A control frame ahead of FEED_CONFIG keeps the gate pending
    connection.emit(frames.keepaliveFrame)
    const pending = await Promise.race([
      opened.then(() => 'resolved' as const),
      Promise.resolve().then(() => 'pending' as const),
    ])
    expect(pending).toBe('pending')

    // FEED_CONFIG settles the open
    connection.emit(frames.quoteFeedConfig)
    await expect(opened).resolves.toBeUndefined()
  })

  it('builders.customSubscriptionMessages sends the FEED_SUBSCRIPTION add with the symbol, and handlers.message emits the parsed bid/ask onto the subscribed params', async () => {
    // Put the FEED_CONFIG field layout in place through the real open hook
    const connection = makeConnection()
    const opened = (stockQuotesTransport as any).config.handlers.open(connection, {
      adapterSettings: { WS_CONNECTION_OPEN_TIMEOUT: 10_000 },
    })
    connection.emit(frames.quoteFeedConfig)
    await opened

    // The subscription delta flows through the real transport builder into the
    // spec primary_command message 4: FEED_SUBSCRIPTION add with the symbol
    expect(
      (stockQuotesTransport as any).config.builders.customSubscriptionMessages(
        {},
        { desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] },
      ),
    ).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, add: [{ symbol: 'AAPL:USLF24', type: 'Quote' }] },
    ])

    // The COMPACT FEED_DATA Quote frame (spec sample_response, second record:
    // bid 189.90 / ask 190.10, volumes 50/80, time 1760000001000) maps onto
    // the subscribed params through handlers.message
    const results = (stockQuotesTransport as any).config.handlers.message(frames.stockQuotesFrame)
    expect(results).toEqual([
      {
        params: QUOTE_PARAMS,
        response: {
          result: 190,
          data: {
            mid_price: 190,
            bid_price: 189.9,
            bid_volume: 50,
            ask_price: 190.1,
            ask_volume: 80,
          },
          timestamps: { providerIndicatedTimeUnixMs: 1760000001000 },
        },
      },
    ])
  })
})
