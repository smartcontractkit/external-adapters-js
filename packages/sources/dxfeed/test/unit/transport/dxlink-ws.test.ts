import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { config } from '../../../src/config'
import { tradeProcessor, tradeTickers } from '../../../src/transport/price-ws'
import {
  quoteRecordToResult,
  transport as stockQuotesTransport,
} from '../../../src/transport/stock-quotes'
import {
  DxLinkFeed,
  DxLinkFeedDeps,
  DxLinkMessage,
  dxLinkConnectionOptions,
  openDxLinkConnection,
} from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

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
  // subscription index (normally populated by the custom builder)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
  return feed
}

const tradeFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => tradeTickers(params.base),
    processRecord: (eventType, record, params: any) =>
      tradeProcessor.processRecord(eventType, record, params),
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

/** Resolves 'pending' for an unsettled promise, else its settled state. */
const settledState = (p: Promise<unknown>) =>
  Promise.race([
    p.then(
      () => 'resolved' as const,
      () => 'rejected' as const,
    ),
    Promise.resolve().then(() => 'pending' as const),
  ])

describe('Basic Authorization handshake header (spec data_source_authentication.usage.handshake_header)', () => {
  it('builds the Authorization: Basic header from API_USERNAME and API_PASSWORD', () => {
    const options = dxLinkConnectionOptions({
      API_USERNAME: 'dxfeed-user',
      API_PASSWORD: 'dxfeed-pass',
    })

    expect(options).toEqual({
      headers: {
        Authorization: `Basic ${Buffer.from('dxfeed-user:dxfeed-pass').toString('base64')}`,
      },
    })
  })

  it('sends the Authorization header on the transport handshake, connecting to WS_API_ENDPOINT verbatim', () => {
    const transportConfig = (stockQuotesTransport as any).config

    expect(
      transportConfig.options({
        adapterSettings: { API_USERNAME: 'dxfeed-user', API_PASSWORD: 'dxfeed-pass' },
      }),
    ).toEqual({
      headers: {
        Authorization: `Basic ${Buffer.from('dxfeed-user:dxfeed-pass').toString('base64')}`,
      },
    })

    // Spec data_source_authentication: credentials ride the header, never the URL
    const url = transportConfig.url({
      adapterSettings: { WS_API_ENDPOINT: 'wss://tools.dxfeed.com/dxlink-chainlink' },
    })
    expect(url).toBe('wss://tools.dxfeed.com/dxlink-chainlink')
    expect(url).not.toContain('@')
  })
})

describe('dxLink handshake open gate (spec primary_command)', () => {
  it('sends SETUP -> CHANNEL_REQUEST -> FEED_SETUP in order with the spec message shapes', () => {
    const connection = makeConnection()
    void openDxLinkConnection(connection)

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
    expect(feedSetup.acceptEventFields?.Trade).toEqual(frames.priceFeedConfig.eventFields.Trade)
    expect(feedSetup.acceptEventFields?.TradeETH).toEqual(
      frames.priceFeedConfig.eventFields.TradeETH,
    )
  })

  it('resolves only after the FEED_CONFIG arrives, completing inside the open-timeout budget', async () => {
    const connection = makeConnection()
    let captured: Record<string, string[]> | undefined
    // Budget = the framework WS_CONNECTION_OPEN_TIMEOUT default; the handshake
    // must settle well inside it once FEED_CONFIG comes back
    const opened = openDxLinkConnection(connection, (fields) => (captured = fields), 10_000)

    // No FEED_CONFIG yet: the gate stays pending through unrelated frames
    expect(await settledState(opened)).toBe('pending')
    connection.emit(frames.keepaliveFrame)
    expect(await settledState(opened)).toBe('pending')

    connection.emit(frames.quoteFeedConfig)
    await expect(opened).resolves.toBeUndefined()
    expect(captured).toEqual({ Quote: frames.quoteFeedConfig.eventFields.Quote })
  })

  it('rejects when the provider answers the handshake with an ERROR frame', async () => {
    const connection = makeConnection()
    const opened = openDxLinkConnection(connection)

    connection.emit(frames.errorFrame)
    await expect(opened).rejects.toThrow(/Unauthorized/)
  })

  it('rejects when FEED_CONFIG never arrives within the open-timeout budget', async () => {
    jest.useFakeTimers()
    try {
      const connection = makeConnection()
      const opened = openDxLinkConnection(connection, undefined, 10_000)

      expect(await settledState(opened)).toBe('pending')
      await jest.advanceTimersByTimeAsync(10_000)
      await expect(opened).rejects.toThrow(/handshake did not complete/)
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('FEED_SUBSCRIPTION fanout (spec primary_command; owner decision tradeteth=match_reference)', () => {
  it('subscribes Trade + TradeETH for an :USLF24 ticker and Trade only for a bare ticker', () => {
    const feed = tradeFeed()
    const params = { base: 'AAPL:USLF24', quote: 'USD' }

    expect(feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ],
      },
    ])

    // A bare ticker emits no TradeETH entry
    expect(tradeTickers('SPCX')).toEqual([{ symbol: 'SPCX', type: 'Trade' }])
  })

  it('emits the matching remove array on unsubscribe', () => {
    const feed = quoteFeed()
    const nowStale = { base: 'TSLA', requireVolume: false, isOvernight: false }

    expect(feed.subscriptionMessages({ desired: [], new: [], stale: [nowStale] })).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, remove: [{ symbol: 'TSLA', type: 'Quote' }] },
    ])
  })

  it('re-sends the whole desired set as adds on reconnect (framework resubscribe)', () => {
    const feed = tradeFeed()
    const params = { base: 'AAPL:USLF24', quote: 'USD' }

    feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })
    // On reconnect the framework re-delivers the full desired set as `new`
    expect(feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })).toEqual([
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

describe('COMPACT FEED_DATA parsing (spec acceptDataFormat=COMPACT / sample_response frames)', () => {
  it('parses a Quote frame into the bid/ask fields of the spec first record', () => {
    const results = quoteFeed().message(frames.stockQuotesFrame as any)

    expect(results).toHaveLength(1)
    const response = results[0] as any
    // Spec stock_quotes sample_response, first record:
    // mid=(189.95+190.05)/2=190, bid 189.95/100, ask 190.05/200, time 1760000000000
    expect(response.result).toBe(190)
    expect(response.data).toEqual({
      mid_price: 190,
      bid_price: 189.95,
      bid_volume: 100,
      ask_price: 190.05,
      ask_volume: 200,
    })
    expect(response.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('treats a "NaN" bidPrice as invalid (spec valueRangeScalingNotes)', () => {
    const results = quoteFeed().message(frames.stockQuotesInvalidFrame as any)

    expect(results).toHaveLength(1)
    const error = results[0] as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('invalid')
  })

  it('drops a truncated trailing record instead of misparsing it', () => {
    const feed = quoteFeed()
    const partialFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Quote',
        [
          ...frames.stockQuotesFrame.data[1].slice(0, 9),
          // a second record missing its last 5 fields
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

  it('strips \\x00 padding from string fields before mapping the wire symbol', () => {
    const feed = quoteFeed()
    const paddedFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Quote',
        ['Quote', 'AAPL:USLF24\x00', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V'],
      ],
    }

    const results = feed.message(paddedFrame as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).data.mid_price).toBe(190)
  })

  it('produces no data events for ERROR, KEEPALIVE and CHANNEL_CLOSED control frames', () => {
    const feed = quoteFeed()
    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect(feed.message(frame as any)).toEqual([])
    }
  })

  it('serves the newest-time record when Trade and a newer TradeETH both arrive', () => {
    const feed = tradeFeed()

    // Spec price sample_response: Trade at t=1760000000000, price 189.98
    const trade = feed.message(frames.priceTradeFrame as any)
    expect(trade).toHaveLength(1)
    expect((trade[0] as any).result).toBe(189.98)

    // A newer TradeETH record wins the newest-time selection
    const extended = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'TradeETH',
        [
          'TradeETH',
          'AAPL:USLF24',
          1760000000500,
          190.02,
          5,
          12346,
          'V',
          0.13,
          5000001,
          999000001,
          'DOWN',
          true,
        ],
      ],
    } as any)
    expect((extended[0] as any).result).toBe(190.02)

    // An older, late-arriving Trade record is dropped
    const late = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Trade',
        [
          'Trade',
          'AAPL:USLF24',
          1760000000200,
          188.0,
          1,
          12344,
          'V',
          0.11,
          5000000,
          999000000,
          'UP',
          false,
        ],
      ],
    } as any)
    expect(late).toEqual([])
  })
})

describe('keepalive (spec keepalive interval_seconds=30 / framework WS_HEARTBEAT_INTERVAL_MS)', () => {
  it('sends exactly the dxLink KEEPALIVE frame on channel 0 from the heartbeat handler', () => {
    const send = jest.fn()

    ;(stockQuotesTransport as any).config.handlers.heartbeat({ send })

    expect(send).toHaveBeenCalledTimes(1)
    expect(JSON.parse(send.mock.calls[0][0])).toEqual({ type: 'KEEPALIVE', channel: 0 })
  })

  it('pins the heartbeat cadence at 30000ms', () => {
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

describe('stale serving + reconnect window (owner decisions stale_quote_serving, reconnect_cache_behavior)', () => {
  it('maps a stale record to a success carrying its original provider timestamp, with no max-age error', () => {
    // The spec sample timestamp (2025-10-09) is in the past relative to the test
    // clock; the record must still map to a cacheable success carrying that time
    const staleRecord = ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V']
    const response = quoteRecordToResult(staleRecord, QUOTE_PARAMS) as any

    expect(response.errorMessage).toBeUndefined()
    expect(response.statusCode).toBeUndefined()
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
  })

  it('keeps mapping FEED_DATA after CHANNEL_CLOSED so the cached last value stays servable across the reconnect window', () => {
    const feed = quoteFeed()

    // CHANNEL_CLOSED produces no results and drops no mapping state
    expect(feed.message(frames.channelClosedFrame as any)).toEqual([])

    // The framework reconnects and re-delivers the full desired set
    feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })

    const out = feed.message(frames.stockQuotesFrame as any)
    expect(out).toHaveLength(1)
    expect((out[0] as any).result).toBe(190)
    expect((out[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })
})
