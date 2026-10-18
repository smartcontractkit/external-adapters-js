import { LoggerFactory, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import {
  DxLinkFeed,
  DxLinkFeedDeps,
  MAX_PROVIDER_FRAME_LOG_LENGTH,
  parseNumeric,
} from '../../src/dxlink/protocol'
import { TradeProcessor, tradeTickers } from '../../src/transport/price-ws'
import { quoteRecordToResult } from '../../src/transport/stock-quotes'
import frames from './fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

const PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }
const PRICE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD' }

/** A Quote feed wired exactly like the stock_quotes transport (spec overrides resolve upstream: params.base is the wire ticker). */
const specQuoteFeed = (): DxLinkFeed => {
  const feed = new DxLinkFeed({
    formatTickers: (params: { base: string }) => [
      { symbol: params.base.toUpperCase(), type: 'Quote' },
    ],
    processRecord: (_eventType, record, params) => quoteRecordToResult(record, params),
  } as DxLinkFeedDeps<any>)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [PARAMS], new: [PARAMS], stale: [] })
  return feed
}

/** A Trade feed wired exactly like the price WS transport (TradeProcessor newest-time selection). */
const specTradeFeed = (): DxLinkFeed => {
  const processor = new TradeProcessor()
  return new DxLinkFeed({
    formatTickers: (params: { base: string }) => tradeTickers(params.base),
    processRecord: (eventType, record, params) =>
      processor.processRecord(eventType, record, params as any),
  } as DxLinkFeedDeps<any>)
}

describe('parseNumeric (spec valueRangeScalingNotes: values arrive as JSON numbers, or the JSON string "NaN" which is invalid)', () => {
  it('returns a JSON number unchanged', () => {
    expect(parseNumeric(190.05)).toBe(190.05)
    expect(parseNumeric(100)).toBe(100)
    expect(parseNumeric(0)).toBe(0)
  })

  it('returns NaN for a string-encoded number ("190.05") — no Number() coercion, a numeric string is a wire-shape regression', () => {
    expect(Number.isNaN(parseNumeric('190.05'))).toBe(true)
  })

  it('returns NaN for a numeric-position string value (a timestamp arriving as a string is a wire-shape regression, never parsed)', () => {
    expect(Number.isNaN(parseNumeric('1760000000000'))).toBe(true)
  })

  it('returns NaN for the "NaN" marker string (invalid)', () => {
    expect(Number.isNaN(parseNumeric('NaN'))).toBe(true)
  })
})

describe('COMPACT FEED_DATA frame with several records (spec stock_quotes sample_response concatenates two Quote records for AAPL:USLF24 in one frame)', () => {
  it('yields the values of the SECOND record per wire key — the spec example response maps the newest record of the sample frame', () => {
    // Spec endpoint_request_response_examples[0].response: mid_price 190.0,
    // bid 189.90/50, ask 190.10/80, providerIndicatedTimeUnixMs 1760000001000 —
    // the second record of the sample frame, not the first (189.95/100,
    // 190.05/200, t=1760000000000)
    const results = specQuoteFeed().message(frames.stockQuotesFrame)

    expect(results).toHaveLength(1)
    const result = results[0] as unknown as {
      result: number
      data: Record<string, number>
      timestamps: { providerIndicatedTimeUnixMs: number }
      params: { base: string }
    }
    expect(result.result).toBe(190.0)
    expect(result.data).toEqual({
      mid_price: 190.0,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    expect(result.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
    expect(result.params.base).toBe('AAPL:USLF24')
  })
})

describe('price endpoint COMPACT FEED_DATA (spec price sample_response)', () => {
  it('parses the spec Trade frame to result 189.98 with providerIndicatedTimeUnixMs 1760000000000', () => {
    const feed = specTradeFeed()
    feed.onFeedConfig(frames.priceFeedConfig.eventFields)
    feed.subscriptionMessages({ desired: [PRICE_PARAMS], new: [PRICE_PARAMS], stale: [] })

    const results = feed.message(frames.priceTradeFrame)

    expect(results).toHaveLength(1)
    const result = results[0] as unknown as {
      result: number
      timestamps: { providerIndicatedTimeUnixMs: number }
      params: { base: string }
    }
    expect(result.result).toBe(189.98)
    // Spec price response_mapping: result = price, provider_timestamp = time
    expect(result.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
    expect(result.params.base).toBe('AAPL:USLF24')
  })
})

describe('"NaN" bidPrice yields an invalid record (spec stock_quotes sample_response second frame; valueRangeScalingNotes: the JSON string "NaN" is invalid)', () => {
  it('maps to a 502 error result, never a silent zero or a throw', () => {
    const results = specQuoteFeed().message(frames.stockQuotesInvalidFrame)

    expect(results).toHaveLength(1)
    const result = results[0] as unknown as {
      statusCode?: number
      errorMessage?: string
      data?: unknown
    }
    expect(result.statusCode).toBe(502)
    expect(result.errorMessage).toContain('Bid price')
    expect(result.data).toBeUndefined()
  })
})

describe('truncated trailing record (spec: a torn COMPACT tail drops without error)', () => {
  it('serves the complete record and drops the partial tail', () => {
    const feed = specQuoteFeed()

    // One complete Quote record (9 fields) followed by a torn 4-field tail
    const tornFrame = {
      type: 'FEED_DATA',
      channel: 1,
      data: [
        'Quote',
        [
          'Quote',
          'AAPL:USLF24',
          1760000000000,
          189.95,
          190.05,
          100,
          200,
          'V',
          'V',
          'Quote',
          'AAPL:USLF24',
          1760000001000,
          189.99,
        ],
      ],
    }

    expect(() => feed.message(tornFrame as any)).not.toThrow()
    const results = feed.message(tornFrame as any)
    expect(results).toHaveLength(1)
    const result = results[0] as unknown as { data: Record<string, number> }
    // The torn tail's 189.99 @ ...001000 is gone; the complete record is served
    expect(result.data).toEqual({
      mid_price: 190.0,
      bid_price: 189.95,
      bid_volume: 100,
      ask_price: 190.05,
      ask_volume: 200,
    })
  })
})

describe('ERROR / KEEPALIVE / CHANNEL_CLOSED frames produce no data records', () => {
  it('maps each control frame to an empty result list', () => {
    const feed = specQuoteFeed()
    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect(feed.message(frame as any)).toEqual([])
    }
  })
})

describe('FEED_CONFIG handling (plan feed-config-double-handling: each FEED_CONFIG frame routes to exactly one handler; onFeedConfig is idempotent and a divergent re-assertion never clears the accepted layout)', () => {
  it('an identical FEED_CONFIG re-assertion is a no-op: the later valid FEED_DATA frames still produce records', () => {
    const feed = specQuoteFeed()

    // The handshake FEED_CONFIG that settled the open gate can still be
    // dispatched to handlers.message afterwards: identical fields are a no-op
    expect(feed.message(frames.quoteFeedConfig as any)).toEqual([])

    const results = feed.message(frames.stockQuotesFrame as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).result).toBe(190.0)
  })

  it('a divergent FEED_CONFIG after the open gate settles logs an error and KEEPS the accepted eventFields: later valid FEED_DATA frames still produce records', () => {
    const feed = specQuoteFeed()

    // A divergent re-assertion: the Quote field ORDER diverges from the
    // requested acceptEventFields (which the accepted layout was pinned to)
    const divergent = {
      type: 'FEED_CONFIG',
      channel: 1,
      eventFields: {
        Quote: [
          'eventSymbol',
          'eventType',
          'time',
          'bidPrice',
          'askPrice',
          'bidSize',
          'askSize',
          'bidExchangeCode',
          'askExchangeCode',
        ],
      },
    }
    feed.message(divergent as any)

    // eventFields stays populated with the LAST ACCEPTED layout — the spec
    // sample frame still maps on it instead of being dropped silently
    const results = feed.message(frames.stockQuotesFrame as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).data).toEqual({
      mid_price: 190.0,
      bid_price: 189.9,
      bid_volume: 50,
      ask_price: 190.1,
      ask_volume: 80,
    })
    expect((results[0] as any).timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000001000 })
  })
})

/**
 * Runs fn with a FRESH DxLinkFeed built from an isolated module registry wired
 * to a recording logger, and returns every emitted log line. The protocol
 * module binds its logger on the FIRST log call, so each capture needs its own
 * registry (the same pattern captureFeedWarnings uses in log-truncation.test.ts).
 * Every level is recorded: the ERROR / CHANNEL_CLOSED paths log via warn, the
 * FEED_CONFIG rejection via error.
 */
const captureProtocolLogLines = (run: (feed: DxLinkFeed) => void): string[] => {
  const lines: string[] = []
  const recordingFactory: LoggerFactory = {
    child: () => {
      const levels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const
      const methods: Record<string, (...args: unknown[]) => void> = {}
      for (const level of levels) {
        methods[level] = (...args: unknown[]) => {
          lines.push(args.map((arg) => String(arg)).join(' '))
        }
      }
      return methods as unknown as ReturnType<LoggerFactory['child']>
    },
  }

  jest.isolateModules(() => {
    // The isolated registry holds fresh copies of the framework modules too,
    // so the recorder must be set on THAT registry's provider
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const framework = require('@chainlink/external-adapter-framework/util') as {
      LoggerFactoryProvider: typeof LoggerFactoryProvider
    }
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
    const { DxLinkFeed: FreshDxLinkFeed } = require('../../src/dxlink/protocol') as {
      DxLinkFeed: typeof DxLinkFeed
    }

    framework.LoggerFactoryProvider.set(recordingFactory)
    try {
      const feed = new FreshDxLinkFeed({
        formatTickers: () => [],
        processRecord: () => undefined,
      } as DxLinkFeedDeps<any>)
      run(feed)
    } finally {
      framework.LoggerFactoryProvider.set()
    }
  })
  return lines
}

describe('provider-controlled log fields are capped (round 2: the ERROR, CHANNEL_CLOSED and FEED_CONFIG-rejection log sites emit provider-controlled strings only through truncateForLog)', () => {
  // A marker past the cap: it survives only if the provider string is logged untruncated
  const injected = `\nINJECTED-LOG-LINE`
  const oversized = (seed: string) => `${seed}${'x'.repeat(MAX_PROVIDER_FRAME_LOG_LENGTH * 2)}`

  it('an ERROR frame with an oversized code and message logs ONE line capped at MAX_PROVIDER_FRAME_LOG_LENGTH with no newline injection', () => {
    const rawCode = oversized('E')
    const rawMessage = `provider failure ${oversized('y')}${injected}`
    // Input sanity: both provider-controlled strings really do exceed the cap
    expect(rawCode.length).toBeGreaterThan(MAX_PROVIDER_FRAME_LOG_LENGTH)
    expect(rawMessage.length).toBeGreaterThan(MAX_PROVIDER_FRAME_LOG_LENGTH)

    const lines = captureProtocolLogLines((feed) =>
      feed.message({ type: 'ERROR', channel: 1, code: rawCode, message: rawMessage } as any),
    )

    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('dxLink ERROR')
    expect(lines[0].length).toBeLessThanOrEqual(MAX_PROVIDER_FRAME_LOG_LENGTH)
    expect(lines[0]).not.toContain('\n')
  })

  it('a CHANNEL_CLOSED frame with an oversized symbol and eventType logs ONE line capped at MAX_PROVIDER_FRAME_LOG_LENGTH with no newline injection', () => {
    const rawEventType = oversized('Quote')
    const rawSymbol = `${oversized('AAPL:USLF24')}${injected}`
    expect(rawEventType.length).toBeGreaterThan(MAX_PROVIDER_FRAME_LOG_LENGTH)
    expect(rawSymbol.length).toBeGreaterThan(MAX_PROVIDER_FRAME_LOG_LENGTH)

    const lines = captureProtocolLogLines((feed) =>
      feed.message({
        type: 'CHANNEL_CLOSED',
        channel: 1,
        eventType: rawEventType,
        symbol: rawSymbol,
      } as any),
    )

    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('dxLink channel 1 closed')
    expect(lines[0].length).toBeLessThanOrEqual(MAX_PROVIDER_FRAME_LOG_LENGTH)
    expect(lines[0]).not.toContain('\n')
  })

  it('a rejected FEED_CONFIG with an oversized accepted field list logs ONE error line capped at MAX_PROVIDER_FRAME_LOG_LENGTH with no newline injection', () => {
    // The Quote field ORDER diverges from the requested acceptEventFields (and
    // the list carries an oversized hostile field name) -> assertAcceptedEventFields
    // throws and the rejection log prints the accepted field list
    const rawFields = [
      'eventSymbol',
      'eventType',
      'time',
      'bidPrice',
      'askPrice',
      'bidSize',
      'askSize',
      'bidExchangeCode',
      'askExchangeCode',
      `${oversized('hostile-field')}${injected}`,
    ]

    const lines = captureProtocolLogLines((feed) =>
      feed.message({ type: 'FEED_CONFIG', channel: 1, eventFields: { Quote: rawFields } } as any),
    )

    expect(lines).toHaveLength(1)
    expect(lines[0]).toContain('dxLink FEED_CONFIG rejected')
    expect(lines[0].length).toBeLessThanOrEqual(MAX_PROVIDER_FRAME_LOG_LENGTH)
    expect(lines[0]).not.toContain('\n')
  })
})

describe('customSubscriptionMessages runs only on subscription deltas (plan subscriptionmessages-rebuild-comment: the pinned framework 2.20.0 invokes it solely inside its subscription-diff branch, so the O(desired) rebuild only ever runs on deltas)', () => {
  it('two background executions with an unchanged desired set emit no FEED_SUBSCRIPTION frames', () => {
    const feed = specQuoteFeed()

    // Delta-free executions: nothing added, nothing removed — no frames either time
    expect(feed.subscriptionMessages({ desired: [PARAMS], new: [], stale: [] })).toEqual([])
    expect(feed.subscriptionMessages({ desired: [PARAMS], new: [], stale: [] })).toEqual([])
  })

  it('one added ticker emits exactly one add frame', () => {
    const feed = specQuoteFeed()

    const added = { base: 'TSLA', quote: 'USD' }
    expect(
      feed.subscriptionMessages({ desired: [PARAMS, added], new: [added], stale: [] }),
    ).toEqual([{ type: 'FEED_SUBSCRIPTION', channel: 1, add: [{ symbol: 'TSLA', type: 'Quote' }] }])
  })
})

describe('FEED_SUBSCRIPTION builder emits the add/remove arrays per (symbol, eventType) (spec primary_command)', () => {
  it('emits the Quote add entry for a stock_quotes subscription', () => {
    const feed = new DxLinkFeed({
      formatTickers: (params: { base: string }) => [
        { symbol: params.base.toUpperCase(), type: 'Quote' },
      ],
      processRecord: () => undefined,
    } as DxLinkFeedDeps<any>)

    expect(feed.subscriptionMessages({ desired: [PARAMS], new: [PARAMS], stale: [] })).toEqual([
      { type: 'FEED_SUBSCRIPTION', channel: 1, add: [{ symbol: 'AAPL:USLF24', type: 'Quote' }] },
    ])
  })

  it('emits Trade and TradeETH adds for a :USLF24 price subscription, Trade only for a bare symbol (owner decision match_reference)', () => {
    const uslf = { base: 'AAPL:USLF24', quote: 'USD' }
    expect(
      specTradeFeed().subscriptionMessages({ desired: [uslf], new: [uslf], stale: [] }),
    ).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        add: [
          { symbol: 'AAPL:USLF24', type: 'Trade' },
          { symbol: 'AAPL:USLF24', type: 'TradeETH' },
        ],
      },
    ])

    const bare = { base: 'SPCX', quote: 'USD' }
    expect(
      specTradeFeed().subscriptionMessages({ desired: [bare], new: [bare], stale: [] }),
    ).toEqual([{ type: 'FEED_SUBSCRIPTION', channel: 1, add: [{ symbol: 'SPCX', type: 'Trade' }] }])
  })

  it('emits the remove entries once a wire key is no longer desired by any subscription', () => {
    const feed = specQuoteFeed()
    feed.subscriptionMessages({ desired: [PARAMS], new: [PARAMS], stale: [] })

    expect(feed.subscriptionMessages({ desired: [], new: [], stale: [PARAMS] })).toEqual([
      {
        type: 'FEED_SUBSCRIPTION',
        channel: 1,
        remove: [{ symbol: 'AAPL:USLF24', type: 'Quote' }],
      },
    ])
  })
})
