import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import * as fs from 'fs'
import * as path from 'path'
import { config } from '../../../src/config'
import { tradeTickers } from '../../../src/transport/price-ws'
import {
  quoteRecordToResult,
  transport as stockQuotesTransport,
} from '../../../src/transport/stock-quotes'
import {
  DxLinkFeed,
  DxLinkFeedDeps,
  DxLinkMessage,
  buildDxLinkWsTransport,
  dxLinkConnectionOptions,
  dxLinkHandshakeMessages,
  dxLinkKeepaliveMessage,
  openDxLinkConnection,
} from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The transport modules log via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

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

const tradeFeed = () =>
  new DxLinkFeed({
    formatTickers: (params: any) => tradeTickers(params.base),
    processRecord: () => undefined,
  } as DxLinkFeedDeps<any>)

type TestConnection = {
  sent: DxLinkMessage[]
  send: (data: string) => void
  addEventListener: (event: 'message', listener: (event: { data: unknown }) => void) => void
  emit: (frame: DxLinkMessage | string) => void
}

const makeConnection = (): TestConnection => {
  const sent: DxLinkMessage[] = []
  let messageListener: ((event: { data: unknown }) => void) | undefined
  return {
    sent,
    send: (data: string) => sent.push(JSON.parse(data)),
    addEventListener: (_event: 'message', listener: (event: { data: unknown }) => void) => {
      messageListener = listener
    },
    emit: (frame: DxLinkMessage | string) =>
      messageListener?.({ data: typeof frame === 'string' ? frame : JSON.stringify(frame) }),
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

  it('connects to WS_API_ENDPOINT verbatim with credentials on the header, never the URL', () => {
    const url = (stockQuotesTransport as any).config.url({
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
    expect(setup).toEqual({
      type: 'SETUP',
      channel: 0,
      version: '0.1-js/1.0.0',
      keepaliveTimeout: 60,
      acceptKeepaliveTimeout: 60,
    })
    expect(channelRequest).toEqual({
      type: 'CHANNEL_REQUEST',
      channel: 1,
      service: 'FEED',
      parameters: { contract: 'AUTO' },
    })
    expect(feedSetup.channel).toBe(1)
    expect(feedSetup.acceptAggregationPeriod).toBe(1)
    expect(feedSetup.acceptDataFormat).toBe('COMPACT')
    // The server echoes these lists back as the FEED_CONFIG field order the
    // COMPACT FEED_DATA rows follow
    expect(feedSetup.acceptEventFields?.Quote).toEqual(frames.quoteFeedConfig.eventFields.Quote)
    expect(feedSetup.acceptEventFields?.Trade).toEqual(frames.priceFeedConfig.eventFields.Trade)
    expect(feedSetup.acceptEventFields?.TradeETH).toEqual(
      frames.priceFeedConfig.eventFields.TradeETH,
    )
  })

  it('stays pending until FEED_CONFIG arrives, then resolves with the eventFields layout', async () => {
    const connection = makeConnection()
    let captured: Record<string, string[]> | undefined
    const opened = openDxLinkConnection(connection, (fields) => (captured = fields))

    expect(await settledState(opened)).toBe('pending')

    // Non-FEED_CONFIG frames during the handshake do not settle the gate
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

  it('rejects when FEED_CONFIG never arrives within the open timeout', async () => {
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

describe('FEED_SUBSCRIPTION message building (spec primary_command: FEED_SUBSCRIPTION add/remove)', () => {
  it('sends one add entry for params combos that collapse onto the same wire key', () => {
    const feed = quoteFeed()
    const params1 = { base: 'tsla', requireVolume: false, isOvernight: false }
    const params2 = { base: 'TSLA', requireVolume: true, isOvernight: false }

    const messages = feed.subscriptionMessages({
      desired: [params1, params2],
      new: [params1, params2],
      stale: [],
    })

    expect(messages).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, add: [{ symbol: 'TSLA', type: 'Quote' }] },
    ])
  })

  it('does not unsubscribe a wire key still desired by another params combo', () => {
    const feed = quoteFeed()
    const stillDesired = { base: 'TSLA', requireVolume: false, isOvernight: false }
    const nowStale = { base: 'TSLA', requireVolume: true, isOvernight: false }

    const messages = feed.subscriptionMessages({
      desired: [stillDesired],
      new: [],
      stale: [nowStale],
    })

    expect(messages).toEqual([])
  })

  it('sends a remove entry for a wire key no longer desired by any params combo', () => {
    const feed = quoteFeed()
    const nowStale = { base: 'TSLA', requireVolume: false, isOvernight: false }

    const messages = feed.subscriptionMessages({ desired: [], new: [], stale: [nowStale] })

    expect(messages).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, remove: [{ symbol: 'TSLA', type: 'Quote' }] },
    ])
  })

  it('builds remove-then-add messages for a delta containing both', () => {
    const feed = quoteFeed()
    const newSub = { base: 'AAPL', requireVolume: false, isOvernight: false }
    const staleSub = { base: 'TSLA', requireVolume: false, isOvernight: false }

    const messages = feed.subscriptionMessages({
      desired: [newSub],
      new: [newSub],
      stale: [staleSub],
    })

    expect(messages).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, remove: [{ symbol: 'TSLA', type: 'Quote' }] },
      { type: 'FEED_SUBSCRIPTION', channel: 1, add: [{ symbol: 'AAPL', type: 'Quote' }] },
    ])
  })

  it('sends no messages when there is no subscription delta', () => {
    const feed = quoteFeed()
    const params = { base: 'TSLA', requireVolume: false, isOvernight: false }

    expect(feed.subscriptionMessages({ desired: [params], new: [], stale: [] })).toEqual([])
  })

  it('subscribes TradeETH only for the :USLF24 extended-hours tickers (owner decision match_reference)', () => {
    const feed = tradeFeed()
    const params = { base: 'AAPL:USLF24', quote: 'USD' }

    const messages = feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })

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

    // Regular-hours-only (bare) tickers get exactly one Trade entry
    expect(tradeTickers('SPCX')).toEqual([{ symbol: 'SPCX', type: 'Trade' }])
  })

  it('re-sends the whole desired set as adds after a simulated reconnect', () => {
    const feed = tradeFeed()
    const params = { base: 'AAPL:USLF24', quote: 'USD' }

    // First background execution subscribes the desired set...
    feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })

    // ...on reconnect the framework re-delivers the full desired set as `new`,
    // and the builder must re-send every (symbol, eventType) entry
    const messages = feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })

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

describe('COMPACT FEED_DATA parsing (spec acceptDataFormat=COMPACT)', () => {
  it('splits the spec sample_response Quote frame positionally and maps the first record', () => {
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

  it('rejects a record whose value is the JSON string "NaN" as invalid', () => {
    const results = quoteFeed().message(frames.stockQuotesInvalidFrame as any)

    expect(results).toHaveLength(1)
    const error = results[0] as any
    expect(error.statusCode).toBe(502)
    expect(error.errorMessage).toContain('invalid')
  })

  it('truncates a trailing partial record instead of misparsing it', () => {
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

  it('strips NUL padding from string fields before mapping the wire symbol', () => {
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

  it('produces no results for ERROR, KEEPALIVE and CHANNEL_CLOSED control frames', () => {
    const feed = quoteFeed()
    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect(feed.message(frame as any)).toEqual([])
    }
  })

  it('fans a wire key record out to every desired params combo mapped onto it', () => {
    const processed: any[] = []
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => [
        { symbol: String(params.base).toUpperCase(), type: 'Quote' },
      ],
      processRecord: (_eventType, _record, params: any) => {
        processed.push(params)
        return { result: params.base, data: {} as any, timestamps: {} as any }
      },
    } as DxLinkFeedDeps<any>)

    const params1 = { base: 'tsla', requireVolume: false, isOvernight: false }
    const params2 = { base: 'TSLA', requireVolume: true, isOvernight: false }
    feed.onFeedConfig({ Quote: frames.quoteFeedConfig.eventFields.Quote })
    feed.subscriptionMessages({ desired: [params1, params2], new: [params1, params2], stale: [] })

    const out = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Quote', ['Quote', 'TSLA', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V']],
    } as any)

    expect(processed).toEqual([params1, params2])
    expect(out).toHaveLength(2)
    expect(out.map((r) => (r as any).result)).toEqual(['tsla', 'TSLA'])
  })

  it('does not fan out records for wire keys nobody is subscribed to', () => {
    const feed = new DxLinkFeed({
      formatTickers: (params: any) => [
        { symbol: String(params.base).toUpperCase(), type: 'Quote' },
      ],
      processRecord: () => ({ result: 0, data: {} as any, timestamps: {} as any }),
    } as DxLinkFeedDeps<any>)

    const params = { base: 'AAPL', requireVolume: false, isOvernight: false }
    feed.onFeedConfig({ Quote: frames.quoteFeedConfig.eventFields.Quote })
    feed.subscriptionMessages({ desired: [params], new: [params], stale: [] })

    // A frame for an un-subscribed symbol must not produce results for AAPL
    const out = feed.message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Quote', ['Quote', 'TSLA', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V']],
    } as any)

    expect(out).toEqual([])
  })
})

describe('dxLink keepalive (spec keepalive: interval_seconds=30)', () => {
  it('sends exactly the KEEPALIVE frame on channel 0 from the heartbeat handler', () => {
    const send = jest.fn()

    ;(stockQuotesTransport as any).config.handlers.heartbeat({ send })

    expect(send).toHaveBeenCalledTimes(1)
    expect(JSON.parse(send.mock.calls[0][0])).toEqual({ type: 'KEEPALIVE', channel: 0 })
    expect(dxLinkKeepaliveMessage()).toEqual({ type: 'KEEPALIVE', channel: 0 })
  })

  it('keeps the KEEPALIVE cadence at the pinned 30s default', () => {
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

describe('stale value serving + reconnect cache (owner decisions stale_quote_serving, reconnect_cache_behavior, degraded_stream_alerting)', () => {
  it('serves stale quotes as success with the original provider timestamp, without any max-age error', () => {
    // The spec sample timestamp (2025-10-09) is in the past relative to the test
    // clock; the record must still map to a cacheable success carrying that time
    const staleRecord = ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 100, 200, 'V', 'V']
    const response = quoteRecordToResult(staleRecord, QUOTE_PARAMS) as any

    expect(response.errorMessage).toBeUndefined()
    expect(response.statusCode).toBeUndefined()
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
  })

  it('still maps FEED_DATA after CHANNEL_CLOSED + reconnect resubscribe (no mapping state is dropped)', () => {
    const feed = quoteFeed()

    // The channel closes: no results, and no state reset that would break the
    // framework's ResponseCache window across the reconnect + re-handshake
    expect(feed.message(frames.channelClosedFrame as any)).toEqual([])

    // The framework reconnects and re-delivers the full desired set
    feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })

    const out = feed.message(frames.stockQuotesFrame as any)
    expect(out).toHaveLength(1)
    expect((out[0] as any).result).toBe(190)
    expect((out[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('never hard-fails after repeated ERROR frames (metrics_counters_only)', () => {
    const feed = quoteFeed()
    for (let i = 0; i < 5; i++) {
      expect(() => feed.message(frames.errorFrame as any)).not.toThrow()
      expect(feed.message(frames.errorFrame as any)).toEqual([])
    }
  })
})

describe('legacy cometd transport deletion (spec exception cometd-transport-deletion)', () => {
  const SRC_DIR = path.resolve(__dirname, '../../../src')

  const walk = (dir: string): string[] =>
    fs
      .readdirSync(dir, { withFileTypes: true })
      .flatMap((entry) => {
        const full = path.join(dir, entry.name)
        return entry.isDirectory() ? walk(full) : [full]
      })
      .filter((file) => /\.(ts|json)$/.test(file))

  // config/index.ts legitimately names 'cometd' in the spec's breaking-change env check
  const COMETD_CODE_PATTERNS =
    /DxFeedWebsocketTransport|clientId|\/meta\/(handshake|connect)|cometd/

  it('leaves no cometd transport code anywhere under src/', () => {
    const offenders = walk(SRC_DIR)
      .map((file) => ({ file, content: fs.readFileSync(file, 'utf8') }))
      .filter(({ file, content }) =>
        file.endsWith(path.join('config', 'index.ts'))
          ? /DxFeedWebsocketTransport|clientId|\/meta\/(handshake|connect)/.test(content)
          : COMETD_CODE_PATTERNS.test(content),
      )

    expect(offenders.map((o) => o.file)).toEqual([])
  })

  it('ships the dxLink websocket transport built on the framework WebSocketTransport', () => {
    expect(typeof buildDxLinkWsTransport).toBe('function')
    expect(typeof dxLinkHandshakeMessages).toBe('function')
    expect(typeof dxLinkKeepaliveMessage).toBe('function')
  })
})
