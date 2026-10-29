import { makeLogger, type ProviderResult } from '@chainlink/external-adapter-framework/util'
import type { BaseEndpointTypes } from '../endpoint/stock-quotes'
import { buildDxLinkWsTransport, type DxLinkTransportTypes, QUOTE_EVENT_TYPE } from './dxlink'
import { type StaleTGuard, toNumber } from './utils'

const logger = makeLogger('StockQuotesTransport')

type QuoteResults = ProviderResult<DxLinkTransportTypes<BaseEndpointTypes>>[]

export const transport = buildDxLinkWsTransport<BaseEndpointTypes>({
  buildSubscriptions: (params) => [{ symbol: params.base.toUpperCase(), type: QUOTE_EVENT_TYPE }],

  parseFeedData: (events, guard) => {
    const results: QuoteResults = []
    for (const { eventType, records } of events) {
      if (eventType !== QUOTE_EVENT_TYPE) {
        continue
      }
      for (const record of records) {
        parseQuoteRecord(record, guard, results)
      }
    }
    return results
  },
})

const parseQuoteRecord = (
  record: Record<string, unknown>,
  guard: StaleTGuard,
  results: QuoteResults,
): void => {
  const eventSymbol = String(record.eventSymbol)
  const time = toNumber(record.time)
  const overnightRecord = record.bidExchangeCode === 'O' && record.askExchangeCode === 'O'

  // Evaluate staleness before validation: a back-dated malformed frame must not
  // replace a newer cached value with a 502. The regular and overnight keys are
  // independent, so a record that is stale for the regular series can still be
  // the newest overnight record for the same symbol.
  const keepRegular = guard.keep(eventSymbol, time ?? 0)
  const keepOvernight = overnightRecord && guard.keep(`${eventSymbol}:O`, time ?? 0)
  if (!keepRegular && !keepOvernight) {
    return
  }

  const bidPrice = toNumber(record.bidPrice)
  const askPrice = toNumber(record.askPrice)

  if (bidPrice === null || askPrice === null) {
    logger.warn(`Dropping ${eventSymbol} quote with an invalid bid/ask price`)
    const response = {
      statusCode: 502,
      errorMessage: `Bid price: ${String(record.bidPrice)} or Ask price: ${String(
        record.askPrice,
      )} for ${eventSymbol} is invalid.`,
    }
    if (keepRegular) {
      results.push(
        { params: { base: eventSymbol, requireVolume: false, isOvernight: false }, response },
        { params: { base: eventSymbol, requireVolume: true, isOvernight: false }, response },
      )
    }
    if (keepOvernight) {
      results.push(
        { params: { base: eventSymbol, requireVolume: false, isOvernight: true }, response },
        { params: { base: eventSymbol, requireVolume: true, isOvernight: true }, response },
      )
    }
    return
  }

  const bidVolume = toNumber(record.bidSize)
  const askVolume = toNumber(record.askSize)
  const invalidVolume = bidVolume === null || askVolume === null

  const midPrice = bidPrice === 0 ? askPrice : askPrice === 0 ? bidPrice : (askPrice + bidPrice) / 2

  const response = {
    result: midPrice,
    data: {
      mid_price: midPrice,
      bid_price: bidPrice,
      bid_volume: bidVolume ?? Number.NaN,
      ask_price: askPrice,
      ask_volume: askVolume ?? Number.NaN,
    },
    timestamps: {
      providerIndicatedTimeUnixMs: time ?? undefined,
    },
  }
  const requireVolumeResponse = invalidVolume
    ? {
        statusCode: 502,
        // Report the raw provider values (NaN vs null vs empty) so the 502
        // message preserves what dxfeed actually sent.
        errorMessage: `Bid volume: ${String(record.bidSize)} or Ask volume: ${String(
          record.askSize,
        )} for ${eventSymbol} is invalid.`,
      }
    : response

  if (keepRegular) {
    results.push(
      { params: { base: eventSymbol, requireVolume: false, isOvernight: false }, response },
      {
        params: { base: eventSymbol, requireVolume: true, isOvernight: false },
        response: requireVolumeResponse,
      },
    )
  }
  if (keepOvernight) {
    results.push(
      { params: { base: eventSymbol, requireVolume: false, isOvernight: true }, response },
      {
        params: { base: eventSymbol, requireVolume: true, isOvernight: true },
        response: requireVolumeResponse,
      },
    )
  }
}
