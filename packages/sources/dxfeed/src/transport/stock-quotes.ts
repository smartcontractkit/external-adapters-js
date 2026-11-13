import { BaseEndpointTypes } from '../endpoint/stock-quotes'
import { DxLinkEvent, DxLinkTransport } from './dxlink'
import { toNumber } from './utils'

export class StockQuotesTransport extends DxLinkTransport<BaseEndpointTypes> {
  constructor() {
    super(['Quote'])
  }

  protected parseEvent(event: DxLinkEvent) {
    const base = event.eventSymbol
    const { response, requireVolumeResponse } = buildResponses(event)
    // Regular requests accept every quote; isOvernight accepts only O/O.
    const isOvernightQuote = event.bidExchangeCode === 'O' && event.askExchangeCode === 'O'
    const sessions = isOvernightQuote ? [false, true] : [false]

    return sessions.flatMap((isOvernight) => [
      { params: { base, isOvernight, requireVolume: false }, response },
      { params: { base, isOvernight, requireVolume: true }, response: requireVolumeResponse },
    ])
  }
}

const buildResponses = (event: DxLinkEvent) => {
  const bidPrice = toNumber(event.bidPrice)
  const askPrice = toNumber(event.askPrice)
  // Equity quote needs positive bid/ask; reject, never repair.
  if (bidPrice === null || askPrice === null || bidPrice <= 0 || askPrice <= 0) {
    const error = {
      statusCode: 502,
      errorMessage: `Bid price: ${event.bidPrice} or Ask price: ${event.askPrice} for ${event.eventSymbol} is invalid.`,
    }
    return { response: error, requireVolumeResponse: error }
  }
  if (bidPrice > askPrice) {
    const error = {
      statusCode: 502,
      errorMessage: `Bid price: ${event.bidPrice} is greater than Ask price: ${event.askPrice} for ${event.eventSymbol}.`,
    }
    return { response: error, requireVolumeResponse: error }
  }

  const midPrice = (bidPrice + askPrice) / 2
  if (!Number.isFinite(midPrice)) {
    const error = {
      statusCode: 502,
      errorMessage: `Mid price for ${event.eventSymbol} is invalid.`,
    }
    return { response: error, requireVolumeResponse: error }
  }

  // Negative volume means missing, not zero.
  const volumeOrNull = (value: unknown): number | null => {
    const parsed = toNumber(value)
    return parsed !== null && parsed >= 0 ? parsed : null
  }
  const bidVolume = volumeOrNull(event.bidSize)
  const askVolume = volumeOrNull(event.askSize)

  const response = {
    result: null,
    data: {
      mid_price: midPrice,
      midSource: 'computed' as const,
      bid_price: bidPrice,
      bid_volume: bidVolume,
      ask_price: askPrice,
      ask_volume: askVolume,
    },
    timestamps: { providerIndicatedTimeUnixMs: toNumber(event.time) ?? undefined },
  }

  if (bidVolume === null || askVolume === null) {
    const error = {
      statusCode: 502,
      errorMessage: `Bid volume: ${event.bidSize} or Ask volume: ${event.askSize} for ${event.eventSymbol} is invalid.`,
    }
    return { response, requireVolumeResponse: error }
  }
  return { response, requireVolumeResponse: response }
}

export const transport = new StockQuotesTransport()
