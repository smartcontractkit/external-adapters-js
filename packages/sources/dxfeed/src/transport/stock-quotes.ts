import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes, stockQuotesInputParameters } from '../endpoint/stock-quotes'
import { buildDxLinkWsTransport, DxLinkRawResult, DxLinkRecord, parseNumeric } from './ws'

// The Quote COMPACT record -> stock_quotes result mapping below is the
// adapter-authored parse-frame substitution (spec stock_quotes
// response_mapping; reference-adapter semantics preserved).
// TEMPLATE-EXTENSION: parse-frame
type Params = TypeFromDefinition<typeof stockQuotesInputParameters.definition>

// FEED_CONFIG eventFields.Quote positions (spec stock_quotes sample_response)
// ['eventType','eventSymbol','time','bidPrice','askPrice','bidSize','askSize','bidExchangeCode','askExchangeCode']
const QUOTE_TIME_INDEX = 2
const BID_PRICE_INDEX = 3
const ASK_PRICE_INDEX = 4
const BID_SIZE_INDEX = 5
const ASK_SIZE_INDEX = 6
const BID_EXCHANGE_CODE_INDEX = 7
const ASK_EXCHANGE_CODE_INDEX = 8

/**
 * Spec stock_quotes data source: stream Quote events for the requested symbol.
 * Every request maps onto exactly one (symbol, eventType) feed entry, on the
 * upper-cased DP ticker (e.g. the AAPL override resolves to AAPL:USLF24).
 */
export const quoteTickers = (base: string): { symbol: string; type: string }[] => [
  { symbol: base.toUpperCase(), type: 'Quote' },
]

/**
 * Spec stock_quotes response_mapping: mid = (bid + ask) / 2 over the Quote
 * event's top-of-book. One-sided books mid against the live side; requireVolume
 * = true rejects records with invalid (NaN) sizes instead of zeroing them;
 * isOvernight = true keeps only records where BOTH sides quote on the 'O'
 * (overnight) exchange code.
 */
export const quoteRecordToResult = (
  record: DxLinkRecord | string,
  params: Params,
): DxLinkRawResult | undefined => {
  // A malformed record that is not a COMPACT field array is dropped
  if (!Array.isArray(record)) {
    return undefined
  }
  const base = params.base

  const bidPrice = parseNumeric(record[BID_PRICE_INDEX])
  const askPrice = parseNumeric(record[ASK_PRICE_INDEX])

  // The record's own time rides every result for downstream freshness
  // reporting — but NEVER as NaN (a missing/nonnumeric provider time would
  // otherwise serialize as null in a number-typed field): a record with no
  // finite time carries no provider timestamp
  const time = parseNumeric(record[QUOTE_TIME_INDEX])
  const timestamps = Number.isFinite(time) ? { providerIndicatedTimeUnixMs: time } : undefined

  // Reference branch order (legacy dxfeed stock_quotes transport, preserved bit
  // for bit per spec reference_ea): the one-sided zero-price mid calculation
  // runs FIRST, then the invalid-price (NaN) check — the 502-versus-result
  // decision for zero, NaN and one-sided books matches the legacy transport
  const midPrice = bidPrice === 0 ? askPrice : askPrice === 0 ? bidPrice : (bidPrice + askPrice) / 2

  if (Number.isNaN(bidPrice) || Number.isNaN(askPrice)) {
    return {
      statusCode: 502,
      errorMessage: `Bid price: ${record[BID_PRICE_INDEX]} or Ask price: ${record[ASK_PRICE_INDEX]} for ${base} is invalid.`,
      // The record's own time rides even the error result (the price-ws
      // TradeProcessor error branch shape), so downstream freshness reporting
      // keeps the provider timestamp of this record — omitted when that time
      // is not finite (never NaN in a number-typed field)
      ...(timestamps ? { timestamps } : {}),
    }
  }

  const bidSize = parseNumeric(record[BID_SIZE_INDEX])
  const askSize = parseNumeric(record[ASK_SIZE_INDEX])
  const requireVolume = params.requireVolume
  const isOvernight = params.isOvernight

  // Reference adapter semantics (legacy WS transport stock-quotes.ts): the
  // isOvernight exchange-code filter runs BEFORE the requireVolume check — a
  // record quoting on a non-'O' venue is dropped entirely, so an invalid
  // volume on such a record yields no result, never a 502
  const bidExchangeCode = String(record[BID_EXCHANGE_CODE_INDEX])
  const askExchangeCode = String(record[ASK_EXCHANGE_CODE_INDEX])
  if (isOvernight && !(bidExchangeCode === 'O' && askExchangeCode === 'O')) {
    // Spec: with is_overnight, keep only records quoting on the overnight venue
    // on both sides; drop the record otherwise.
    return undefined
  }

  if (requireVolume && (Number.isNaN(bidSize) || Number.isNaN(askSize))) {
    return {
      statusCode: 502,
      errorMessage: `Bid volume: ${record[BID_SIZE_INDEX]} or Ask volume: ${record[ASK_SIZE_INDEX]} for ${base} is invalid.`,
      // Same error-shape rule: the provider timestamp rides the error result —
      // omitted when that time is not finite
      ...(timestamps ? { timestamps } : {}),
    }
  }

  // Reference semantics: without requireVolume the parsed size value passes
  // through unchanged, NaN included — JSON serializes NaN to null on the wire
  const bidVolume = bidSize
  const askVolume = askSize

  return {
    result: midPrice,
    data: {
      mid_price: midPrice,
      bid_price: bidPrice,
      bid_volume: bidVolume,
      ask_price: askPrice,
      ask_volume: askVolume,
    },
    ...(timestamps ? { timestamps } : {}),
  }
}

export const transport = buildDxLinkWsTransport<BaseEndpointTypes>({
  formatTickers: (params) => quoteTickers(params.base),
  processRecord: (eventType, record, params) =>
    eventType === 'Quote' ? quoteRecordToResult(record, params) : undefined,
})
// END TEMPLATE-EXTENSION
