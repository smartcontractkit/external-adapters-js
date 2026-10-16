import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult } from '../../src/transport/stock-quotes'
import {
  DxLinkFeed,
  DxLinkFeedDeps,
  DxLinkRecord,
  parseCompactFeedData,
} from '../../src/transport/ws'
import frames from './fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

// Spec stock_quotes FEED_CONFIG eventFields.Quote — the COMPACT field order
const QUOTE_EVENT_FIELDS = frames.quoteFeedConfig.eventFields
const QUOTE_PARAMS = { base: 'AAPL:USLF24', quote: 'USD', requireVolume: false, isOvernight: false }

// Spec stock_quotes sample_response, first record: mid=(189.95+190.05)/2=190
const FIRST_SPEC_RECORD: DxLinkRecord = [
  'Quote',
  'AAPL:USLF24',
  1760000000000,
  189.95,
  190.05,
  100,
  200,
  'V',
  'V',
]

const subscribedQuoteFeed = () => {
  const feed = new DxLinkFeed({
    formatTickers: (params: any) => [{ symbol: String(params.base).toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: any) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  feed.onFeedConfig(QUOTE_EVENT_FIELDS)
  feed.subscriptionMessages({ desired: [QUOTE_PARAMS], new: [QUOTE_PARAMS], stale: [] })
  return feed
}

describe('COMPACT frame parsing (spec acceptDataFormat=COMPACT)', () => {
  it('zips the FEED_CONFIG field list positionally: the spec sample frame carries two Quote records', () => {
    // Spec stock_quotes sample_response FEED_DATA: one frame, two concatenated
    // 9-field Quote records
    const records = parseCompactFeedData(
      'Quote',
      frames.stockQuotesFrame.data[1] as DxLinkRecord,
      QUOTE_EVENT_FIELDS,
    )

    expect(records).toHaveLength(2)
    expect(records[0]).toEqual(FIRST_SPEC_RECORD)
    expect(records[1]).toEqual([
      'Quote',
      'AAPL:USLF24',
      1760000001000,
      189.9,
      190.1,
      50,
      80,
      'O',
      'O',
    ])
  })

  it('maps the JSON string "NaN" to invalid and the quote mapping rejects the record with a 502', () => {
    // Spec stock_quotes sample_response, second FEED_DATA frame: "NaN" bidPrice
    const records = parseCompactFeedData(
      'Quote',
      frames.stockQuotesInvalidFrame.data[1] as DxLinkRecord,
      QUOTE_EVENT_FIELDS,
    )
    expect(records).toHaveLength(1)
    // The parser turns the "NaN" string into an invalid number at the bidPrice position
    expect(Number.isNaN(records[0][3] as number)).toBe(true)

    // ...and the record is rejected (error result), never emitted as a price
    const rejected = quoteRecordToResult(records[0], QUOTE_PARAMS) as any
    expect(rejected.statusCode).toBe(502)
    expect(rejected.errorMessage).toContain('invalid')
    expect(rejected.data).toBeUndefined()
  })

  it('truncates a trailing partial record instead of misparsing it', () => {
    // A second record missing its last 5 of 9 fields must be dropped
    const records = parseCompactFeedData(
      'Quote',
      [...FIRST_SPEC_RECORD, 'Quote', 'AAPL:USLF24', 1760000002000, 1] as DxLinkRecord,
      QUOTE_EVENT_FIELDS,
    )

    expect(records).toHaveLength(1)
    expect(records[0]).toEqual(FIRST_SPEC_RECORD)
  })

  it('strips \\x00 padding from string fields', () => {
    const records = parseCompactFeedData(
      'Quote',
      [
        'Quote',
        'AAPL:USLF24\x00',
        1760000000000,
        189.95,
        190.05,
        100,
        200,
        'V',
        'V',
      ] as DxLinkRecord,
      QUOTE_EVENT_FIELDS,
    )

    expect(records).toHaveLength(1)
    expect(records[0][1]).toBe('AAPL:USLF24')
  })

  it('produces no data update for ERROR, KEEPALIVE and CHANNEL_CLOSED frames', () => {
    const feed = subscribedQuoteFeed()
    // ERROR, KEEPALIVE and CHANNEL_CLOSED are control messages, not data
    for (const frame of [frames.errorFrame, frames.keepaliveFrame, frames.channelClosedFrame]) {
      expect(feed.message(frame as any)).toEqual([])
    }
  })

  it('sets providerIndicatedTimeUnixMs from the record time field', () => {
    const records = parseCompactFeedData(
      'Quote',
      frames.stockQuotesFrame.data[1] as DxLinkRecord,
      QUOTE_EVENT_FIELDS,
    )

    for (const record of records) {
      const result = quoteRecordToResult(record, QUOTE_PARAMS) as any
      expect(result.timestamps.providerIndicatedTimeUnixMs).toBe(record[2])
    }
  })
})
