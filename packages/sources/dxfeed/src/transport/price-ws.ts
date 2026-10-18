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
   * Unsubscribe cleanup: the customSubscriptionMessages remove path notifies
   * the transport ONLY for symbols with no desired subscription left on ANY
   * event type — Trade and TradeETH SHARE one newest-time entry per symbol
   * (both event types read and write latestTimeBySymbol[symbol]), so the entry
   * is deleted only when the last Trade/TradeETH subscription for the symbol
   * is gone. A later resubscription starts fresh.
   */
  unsubscribe(entries: dxlinkWs.DxLinkSubscriptionEntry[]): void {
    for (const { symbol, type } of entries) {
      if (type === 'Trade' || type === 'TradeETH') {
        // The wire entries carry the subscribed symbol and dxFeed echoes the
        // subscribed symbol back on the records, so this key matches the
        // verbatim record-symbol keys written by processRecord
        delete this.latestTimeBySymbol[symbol]
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
    // Keyed by the record's eventSymbol EXACTLY AS RECEIVED (the reference
    // adapter keyed updatedTime by the record symbol verbatim; plan
    // record-symbol-uppercase-keying) — no upper-case normalisation on THIS
    // map, while subscription wire keys keep their existing normalisation in
    // tradeTickers: mixed-case provider symbols dedupe against the same
    // mixed-case symbol instead of diverging from reference semantics
    const eventSymbol = String(record[EVENT_SYMBOL_INDEX])
    const time = dxlinkWs.parseNumeric(record[TIME_INDEX])
    const price = dxlinkWs.parseNumeric(record[PRICE_INDEX])
    const latestTime = this.latestTimeBySymbol[eventSymbol]
    // Reference semantics (spec reference_ea: preserve endpoint semantics
    // exactly): only strictly older records are ignored; an equal-time record
    // is served like the newest one
    if (latestTime !== undefined && time < latestTime) {
      return undefined
    }

    // The cursor advances BEFORE the price validation (reference-adapter
    // ordering, spec reference_ea): an invalid newer record still moves the
    // newest-time cursor forward, exactly like the reference transport's
    // `updatedTime[base] = time` ahead of the NaN price check
    if (Number.isFinite(time)) {
      this.latestTimeBySymbol[eventSymbol] = time
    }

    // The record's own time rides every valid result for downstream freshness
    // reporting — but NEVER as NaN (a missing/nonnumeric provider time would
    // otherwise serialize as null in a number-typed field): a record with no
    // finite time carries no provider timestamp
    const timestamps = Number.isFinite(time) ? { providerIndicatedTimeUnixMs: time } : undefined

    if (Number.isNaN(price)) {
      // Invalid records return the 502 path with NO timestamps, matching the
      // reference adapter's error shape (its 502 carried no
      // providerIndicatedTimeUnixMs)
      return {
        statusCode: 502,
        errorMessage: `Price: ${record[PRICE_INDEX]} for ${base} is invalid.`,
      }
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
