import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

// Spec stock_quotes sample_response FEED_CONFIG defines the COMPACT record
// layout; the time field's position in it is protocol-defined
const QUOTE_FIELDS = frames.quoteFeedConfig.eventFields.Quote
const TIME_INDEX = QUOTE_FIELDS.indexOf('time')
const PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

const quoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  // FEED_CONFIG field order first (the open gate hands this over), then the
  // subscription index (normally populated by the custom builder)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: [PARAMS], new: [PARAMS], stale: [] })
  return feed
}

describe('Quote providerIndicatedTimeUnixMs (spec data_freshness.timestamp_field = time)', () => {
  it('maps the Quote record time field from the COMPACT frame fixture, not a bid/ask/volume position', () => {
    // First record of the spec sample frame, one field per FEED_CONFIG entry
    const record = (frames.stockQuotesFrame.data[1] as unknown[]).slice(0, QUOTE_FIELDS.length) as (
      | string
      | number
      | boolean
    )[]

    const response = quoteRecordToResult(record, PARAMS) as any

    // The freshness timestamp is exactly the record's time field value
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBe(record[TIME_INDEX])
    // Spec sample first record: time=1760000000000
    expect(response.timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
  })

  it('reads the time field at its FEED_CONFIG position when the full COMPACT frame parses', () => {
    // The spec sample frame concatenates two records: the first carries
    // time=1760000000000, the second time=1760000001000. The canonical spec
    // example response serves the FIRST record, so the freshness timestamp is
    // the first record's time field, read at the protocol-defined index
    const results = quoteFeed().message(frames.stockQuotesFrame as any)

    expect(results).toHaveLength(1)
    expect((results[0] as any).timestamps.providerIndicatedTimeUnixMs).toBe(
      (frames.stockQuotesFrame.data[1] as unknown[])[TIME_INDEX],
    )
    expect((results[0] as any).timestamps.providerIndicatedTimeUnixMs).toBe(1760000000000)
    expect((results[0] as any).timestamps.providerIndicatedTimeUnixMs).not.toBe(1760000001000)
  })
})
