import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes, priceInputParameters } from '../endpoint/price'
import * as dxlinkWs from './ws'

// FEED_CONFIG eventFields.Trade positions (spec price sample_response)
// The Trade/TradeETH COMPACT record -> price result mapping below is the
// adapter-authored parse-frame substitution (spec price response_mapping,
// newest-time selection per the reference adapter).
// TEMPLATE-EXTENSION: parse-frame
const EVENT_SYMBOL_INDEX = 1
const TIME_INDEX = 2
const PRICE_INDEX = 3

/**
 * Spec price websocket subscription: one Trade entry per ticker, plus a
 * TradeETH entry only for the extended-hours symbols (owner decision
 * tradeteth=match_reference: the ':USLF24' suffixed DP tickers).
 */
export const tradeTickers = (base: string): { symbol: string; type: string }[] => {
  const ticker = base.toUpperCase()
  const tickers = [{ symbol: ticker, type: 'Trade' }]
  if (ticker.includes(':USLF24')) {
    tickers.push({ symbol: ticker, type: 'TradeETH' })
  }
  return tickers
}

/**
 * Regular-hours Trade and extended-hours TradeETH records arrive for the same
 * symbol; serve the record carrying the newest time. Records older than the
 * newest one seen are dropped (degraded_stream_alerting=metrics_counters_only:
 * stale/late records are not surfaced as errors).
 */
export class TradeProcessor {
  /**
   * Newest provider time seen per WIRE symbol. Read-only for callers (tests
   * observe the unsubscribe cleanup through it); mutated only by processRecord
   * and unsubscribe below.
   */
  readonly latestTimeBySymbol: Record<string, number> = {}

  /**
   * Unsubscribe cleanup (round-2): the customSubscriptionMessages remove path
   * notifies the transport when the last subscription for a wire key is gone;
   * deleting the symbol's newest-time entry there keeps this map bounded
   * across subscription churn. A later resubscription starts fresh.
   */
  unsubscribe(entries: dxlinkWs.DxLinkSubscriptionEntry[]): void {
    for (const { symbol, type } of entries) {
      if (type === 'Trade' || type === 'TradeETH') {
        delete this.latestTimeBySymbol[symbol.toUpperCase()]
      }
    }
  }

  processRecord(
    eventType: string,
    record: dxlinkWs.DxLinkRecord,
    params: TypeFromDefinition<typeof priceInputParameters.definition>,
  ): dxlinkWs.DxLinkRawResult | undefined {
    if (eventType !== 'Trade' && eventType !== 'TradeETH') {
      return undefined
    }

    const base = params.base
    // One newest-time state per WIRE symbol (the record's eventSymbol,
    // upper-cased), matching the reference adapter's one-stream-per-symbol
    // behavior: params sets that share a wire key through different base
    // casing share the dedupe state, so an older record can never be served
    // after a newer one on any of them
    const eventSymbol = String(record[EVENT_SYMBOL_INDEX]).toUpperCase()
    const time = dxlinkWs.parseNumeric(record[TIME_INDEX])
    const price = dxlinkWs.parseNumeric(record[PRICE_INDEX])
    const latestTime = this.latestTimeBySymbol[eventSymbol]
    // Reference semantics (spec reference_ea: preserve endpoint semantics
    // exactly): only strictly older records are ignored; an equal-time record
    // is served like the newest one
    if (latestTime !== undefined && time < latestTime) {
      return undefined
    }

    // The record's own time rides every result for downstream freshness
    // reporting — but NEVER as NaN (a missing/nonnumeric provider time would
    // otherwise serialize as null in a number-typed field): a record with no
    // finite time carries no provider timestamp and advances no cursor
    const timestamps = Number.isFinite(time) ? { providerIndicatedTimeUnixMs: time } : undefined

    if (Number.isNaN(price)) {
      // Invalid records return the 502 path WITHOUT advancing the newest-time
      // cursor: a malformed newer record must not suppress valid older records
      return {
        statusCode: 502,
        errorMessage: `Price: ${record[PRICE_INDEX]} for ${base} is invalid.`,
        ...(timestamps ? { timestamps } : {}),
      }
    }

    // The cursor advances only after the price validation passes
    if (Number.isFinite(time)) {
      this.latestTimeBySymbol[eventSymbol] = time
    }

    return {
      result: price,
      data: {
        result: price,
      },
      ...(timestamps ? { timestamps } : {}),
    }
  }
}

/**
 * Builds the price WS transport with its OWN TradeProcessor: the newest-time
 * state is per transport instance, never shared (round-2 fix — the former
 * module-level singleton leaked state across transport instances and grew
 * without bound).
 */
export const buildPriceWsTransport = () => {
  const tradeProcessor = new TradeProcessor()
  return dxlinkWs.buildDxLinkWsTransport<BaseEndpointTypes>({
    formatTickers: (params) => tradeTickers(params.base),
    processRecord: (eventType, record, params) =>
      tradeProcessor.processRecord(eventType, record, params),
    // The remove path of customSubscriptionMessages drops the symbol's
    // newest-time state once its last subscription is gone
    onUnsubscribe: (entries) => tradeProcessor.unsubscribe(entries),
  })
}

export const transport = buildPriceWsTransport()
// END TEMPLATE-EXTENSION
