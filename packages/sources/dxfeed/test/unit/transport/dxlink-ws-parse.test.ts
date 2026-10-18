import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import {
  DxLinkFeed,
  DxLinkFeedDeps,
  DxLinkRecord,
  openDxLinkConnection,
  parseCompactFeedData,
} from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

// The transport module logs via the framework logger, which needs a factory set
LoggerFactoryProvider.set()

/**
 * Plan item 4 proving test, driven by the spec stock_quotes sample_response
 * frames (template transport-ws-subscribe parse-frame + error-mapping
 * extension points; exception dxlink-control-protocol): the COMPACT FEED_DATA
 * records parse positionally against the FEED_CONFIG field layout, the JSON
 * string "NaN" marks a value invalid, an ERROR frame surfaces the provider
 * error, KEEPALIVE yields no update, and a frame with a trailing partial
 * record parses the complete prefix only.
 */
const QUOTE_EVENT_FIELDS = frames.quoteFeedConfig.eventFields
const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

/** Position of a Quote field in the spec FEED_CONFIG eventFields.Quote order */
const fieldIndex = (field: string): number => QUOTE_EVENT_FIELDS.Quote.indexOf(field)

/** The subscribed quote feed, wired exactly like the production transport */
const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  // FEED_CONFIG first (the open gate hands the layout over), then the
  // subscription index (normally populated by the customSubscriptionMessages
  // builder)
  feed.onFeedConfig(QUOTE_EVENT_FIELDS)
  feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
  return feed
}

describe('COMPACT Quote record mapping (spec sample_response FEED_CONFIG + FEED_DATA; response_mapping)', () => {
  it('maps each COMPACT record positionally to eventSymbol/time/bid/ask/sizes/exchange codes', () => {
    // Spec sample_response frame: two 9-field Quote records concatenated flat
    // in the FEED_CONFIG eventFields.Quote order
    const records = parseCompactFeedData(
      'Quote',
      frames.stockQuotesFrame.data[1] as DxLinkRecord,
      QUOTE_EVENT_FIELDS,
    )

    expect(records).toHaveLength(2)
    // Spec response_mapping: symbol=eventSymbol, bid_price=bidPrice,
    // bid_volume=bidSize, bid_exchange=bidExchangeCode, ask_price=askPrice,
    // ask_volume=askSize, ask_exchange=askExchangeCode, provider_timestamp=time
    for (const [i, values] of [
      {
        symbol: 'AAPL:USLF24',
        time: 1760000000000,
        bidPrice: 189.95,
        askPrice: 190.05,
        bidSize: 100,
        askSize: 200,
        bidExchange: 'V',
        askExchange: 'V',
      },
      {
        symbol: 'AAPL:USLF24',
        time: 1760000001000,
        bidPrice: 189.9,
        askPrice: 190.1,
        bidSize: 50,
        askSize: 80,
        bidExchange: 'O',
        askExchange: 'O',
      },
    ].entries()) {
      expect(records[i][fieldIndex('eventSymbol')]).toBe(values.symbol)
      expect(records[i][fieldIndex('time')]).toBe(values.time)
      expect(records[i][fieldIndex('bidPrice')]).toBe(values.bidPrice)
      expect(records[i][fieldIndex('askPrice')]).toBe(values.askPrice)
      expect(records[i][fieldIndex('bidSize')]).toBe(values.bidSize)
      expect(records[i][fieldIndex('askSize')]).toBe(values.askSize)
      expect(records[i][fieldIndex('bidExchangeCode')]).toBe(values.bidExchange)
      expect(records[i][fieldIndex('askExchangeCode')]).toBe(values.askExchange)
    }
  })

  it('maps the freshest record of the spec sample frame to the stock_quotes result shape', () => {
    // response_mapping: mid_price=(bidPrice+askPrice)/2; the spec request/
    // response example pins mid 190.0 and providerIndicatedTimeUnixMs
    // 1760000001000 for this frame
    const results = quoteFeed().message(frames.stockQuotesFrame as any)
    expect(results).toHaveLength(1)
    expect(results[0]).toMatchObject({
      result: 190.0,
      data: {
        mid_price: 190.0,
        bid_price: 189.9,
        bid_volume: 50,
        ask_price: 190.1,
        ask_volume: 80,
      },
      timestamps: { providerIndicatedTimeUnixMs: 1760000001000 },
    })
  })
})

describe('"NaN" marks a record invalid (spec valueRangeScalingNotes: the JSON string "NaN" is invalid)', () => {
  it('a "NaN" bidPrice yields the invalid result instead of a quote', () => {
    // Spec sample_response, second FEED_DATA frame
    const results = quoteFeed().message(frames.stockQuotesInvalidFrame as any)
    expect(results).toHaveLength(1)
    expect(results[0].statusCode).toBe(502)
    expect(results[0].errorMessage).toContain('invalid')
    expect(results[0].result).toBeUndefined()
    expect(results[0].data).toBeUndefined()
  })
})

describe('control frames (exception dxlink-control-protocol; owner decision degraded_stream_alerting=metrics_counters_only)', () => {
  it('an ERROR frame during the handshake surfaces the provider error', async () => {
    // Template error-mapping extension point: the provider's ERROR frame (e.g.
    // unauthorized credentials) rejects the open gate with the provider message
    const connection = {
      send: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }
    const opened = openDxLinkConnection(connection as any)

    connection.addEventListener.mock.calls.find(([event]: string[]) => event === 'message')![1]({
      data: JSON.stringify(frames.errorFrame),
    })
    await expect(opened).rejects.toThrow(/Unauthorized/)
  })

  it('a KEEPALIVE frame yields no update', () => {
    // Spec keepalive: KEEPALIVE frames keep the link alive and carry no data
    expect(quoteFeed().message(frames.keepaliveFrame as any)).toEqual([])
  })

  it('a post-handshake ERROR frame yields no data update (metrics-counters-only alerting)', () => {
    expect(quoteFeed().message(frames.errorFrame as any)).toEqual([])
  })
})

describe('trailing partial record (acceptAggregationPeriod=1 concatenates records; a torn tail must not misparse)', () => {
  it('parses the complete prefix only', () => {
    // The spec sample frame's first (complete) 9-field record followed by a
    // second record missing its last 5 of 9 fields
    const frameWithPartialTail = [
      ...frames.stockQuotesFrame.data[1].slice(0, QUOTE_EVENT_FIELDS.Quote.length),
      'Quote',
      'AAPL:USLF24',
      1760000002000,
      1,
    ] as DxLinkRecord

    const records = parseCompactFeedData('Quote', frameWithPartialTail, QUOTE_EVENT_FIELDS)
    expect(records).toHaveLength(1)
    expect(records[0][fieldIndex('time')]).toBe(1760000000000)
    expect(records[0][fieldIndex('bidPrice')]).toBe(189.95)
    expect(records[0][fieldIndex('askPrice')]).toBe(190.05)

    // Through the message handler the torn tail surfaces no second result
    const results = quoteFeed().message({
      type: 'FEED_DATA',
      channel: 1,
      data: ['Quote', frameWithPartialTail],
    } as any)
    expect(results).toHaveLength(1)
    expect((results[0] as any).data.bid_price).toBe(189.95)
  })
})
