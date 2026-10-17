import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { quoteRecordToResult } from '../../../src/transport/stock-quotes'
import { DxLinkFeed, DxLinkFeedDeps } from '../../../src/transport/ws'
import frames from '../fixtures/dxlink-frames.json'

LoggerFactoryProvider.set()

type QuoteParams = {
  base: string
  quote: string
  requireVolume: boolean
  isOvernight: boolean
}

const BASE_PARAMS: QuoteParams = {
  base: 'AAPL:USLF24',
  quote: 'USD',
  requireVolume: false,
  isOvernight: false,
}

/**
 * Builds a feed whose subscription index maps EVERY params set in `subs` onto
 * the same wire key (Quote:AAPL:USLF24) — the dxLink fan-out state the
 * customSubscriptionMessages builder produces when two params combos resolve to
 * one provider subscription.
 */
const feedWithSubs = (subs: QuoteParams[]) => {
  const feed = new DxLinkFeed({
    formatTickers: (params: QuoteParams) => [{ symbol: params.base.toUpperCase(), type: 'Quote' }],
    processRecord: (eventType, record, params: QuoteParams) =>
      eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
  } as DxLinkFeedDeps<any>)
  feed.onFeedConfig(frames.quoteFeedConfig.eventFields)
  feed.subscriptionMessages({ desired: subs, new: subs, stale: [] })
  return feed
}

// Spec stock_quotes sample_response, second FEED_DATA frame: a valid ask price
// but the bid price is the JSON string "NaN" (invalid per
// valueRangeScalingNotes). time=1760000000000.
const NAN_BID_PRICE_FRAME = frames.stockQuotesInvalidFrame

// Same record layout but with the invalid values in the VOLUME positions
const NAN_VOLUME_FRAME = {
  type: 'FEED_DATA',
  channel: 1,
  data: ['Quote', ['Quote', 'AAPL:USLF24', 1760000000000, 189.95, 190.05, 'NaN', 'NaN', 'V', 'V']],
}

describe('provider timestamp on 502 error results (spec report fields: timestamps.providerIndicatedTimeUnixMs on EVERY result)', () => {
  it('a "NaN" bid price yields a 502 carrying the record time', () => {
    const [result] = feedWithSubs([BASE_PARAMS]).message(NAN_BID_PRICE_FRAME as any)

    expect(result?.statusCode).toBe(502)
    expect(result?.errorMessage).toMatch(/[Pp]rice/)
    // The record's own time (spec data_freshness.timestamp_field = time), not
    // the adapter clock: the frame's only record carries time=1760000000000
    expect(result?.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('an invalid volume under requireVolume=true yields a 502 carrying the record time', () => {
    const result = quoteRecordToResult(NAN_VOLUME_FRAME.data[1] as any, {
      ...BASE_PARAMS,
      requireVolume: true,
    }) as any

    expect(result.statusCode).toBe(502)
    expect(result.errorMessage).toMatch(/[Vv]olume/)
    expect(result.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })
})

describe('per-params fan-out on one wire key (subsByWireKey keys results by exact params)', () => {
  it('one invalid-volume record: requireVolume=true gets the 502, requireVolume=false gets the value with the NaN volume serialized as null', () => {
    const lenient = { ...BASE_PARAMS, requireVolume: false }
    const strict = { ...BASE_PARAMS, requireVolume: true }
    const results = feedWithSubs([lenient, strict]).message(NAN_VOLUME_FRAME as any)

    expect(results).toHaveLength(2)

    const lenientResult = results.find((r) => r.params.requireVolume === false) as any
    const strictResult = results.find((r) => r.params.requireVolume === true) as any

    // Lenient params: the spec example mapping succeeds — mid of the live book,
    // and the invalid size passes through unchanged (NaN), which JSON
    // serializes to null on the wire
    expect(lenientResult.statusCode).toBeUndefined()
    expect(lenientResult.data).toEqual({
      mid_price: 190,
      bid_price: 189.95,
      bid_volume: NaN,
      ask_price: 190.05,
      ask_volume: NaN,
    })
    expect(JSON.parse(JSON.stringify(lenientResult.data)).bid_volume).toBeNull()
    expect(JSON.parse(JSON.stringify(lenientResult.data)).ask_volume).toBeNull()
    expect(lenientResult.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })

    // Strict params: the same record errors instead of zeroing the volumes
    expect(strictResult.statusCode).toBe(502)
    expect(strictResult.errorMessage).toMatch(/[Vv]olume/)
    expect(strictResult.timestamps).toEqual({ providerIndicatedTimeUnixMs: 1760000000000 })
  })

  it('one regular-venue record: isOvernight=true rejects it while isOvernight=false on the SAME wire key accepts it', () => {
    const overnight = { ...BASE_PARAMS, isOvernight: true }
    const regular = { ...BASE_PARAMS, isOvernight: false }
    const results = feedWithSubs([overnight, regular]).message(NAN_VOLUME_FRAME as any)

    // One record in, exactly one result out: the overnight params drop the
    // record (neither side quotes on 'O'), the regular params map it
    expect(results).toHaveLength(1)
    expect(results[0].params.isOvernight).toBe(false)
    expect((results[0] as any).data.mid_price).toBe(190)
  })
})
