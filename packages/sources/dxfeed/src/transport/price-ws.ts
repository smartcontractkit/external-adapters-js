import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'
import { BaseEndpointTypes, priceInputParameters } from '../endpoint/price'
import { buildDxLinkWsTransport, DxLinkRawResult, DxLinkRecord, parseNumeric } from './ws'

// FEED_CONFIG eventFields.Trade positions (spec price sample_response)
// The Trade/TradeETH COMPACT record -> price result mapping below is the
// adapter-authored parse-frame substitution (spec price response_mapping,
// newest-time selection per the reference adapter).
// TEMPLATE-EXTENSION: parse-frame
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
  private readonly latestTimeBySymbol: Record<string, number> = {}

  processRecord(
    eventType: string,
    record: DxLinkRecord,
    params: TypeFromDefinition<typeof priceInputParameters.definition>,
  ): DxLinkRawResult | undefined {
    if (eventType !== 'Trade' && eventType !== 'TradeETH') {
      return undefined
    }

    const base = params.base
    const time = parseNumeric(record[TIME_INDEX])
    const price = parseNumeric(record[PRICE_INDEX])
    const latestTime = this.latestTimeBySymbol[base]
    // Reference semantics (spec reference_ea: preserve endpoint semantics
    // exactly): only strictly older records are ignored; an equal-time record
    // is served like the newest one
    if (latestTime !== undefined && time < latestTime) {
      return undefined
    }
    this.latestTimeBySymbol[base] = time

    if (Number.isNaN(price)) {
      return {
        statusCode: 502,
        errorMessage: `Price: ${record[PRICE_INDEX]} for ${base} is invalid.`,
        // The record's own time rides even the invalid result, so downstream
        // freshness reporting keeps the provider timestamp of this record
        timestamps: {
          providerIndicatedTimeUnixMs: time,
        },
      }
    }

    return {
      result: price,
      data: {
        result: price,
      },
      timestamps: {
        providerIndicatedTimeUnixMs: time,
      },
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
  return buildDxLinkWsTransport<BaseEndpointTypes>({
    formatTickers: (params) => tradeTickers(params.base),
    processRecord: (eventType, record, params) =>
      tradeProcessor.processRecord(eventType, record, params),
  })
}

export const transport = buildPriceWsTransport()
// END TEMPLATE-EXTENSION
