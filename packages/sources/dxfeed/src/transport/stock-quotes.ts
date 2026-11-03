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
    // Every quote serves regular requests, but isOvernight requests only accept quotes from
    // the overnight venue (exchange code O on both sides)
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
  if (bidPrice === null || askPrice === null) {
    const error = {
      statusCode: 502,
      errorMessage: `Bid price: ${event.bidPrice} or Ask price: ${event.askPrice} for ${event.eventSymbol} is invalid.`,
    }
    return { response: error, requireVolumeResponse: error }
  }

  // A side quoted at 0 has no liquidity, so the mid falls back to the other side
  const midPrice = bidPrice === 0 ? askPrice : askPrice === 0 ? bidPrice : (bidPrice + askPrice) / 2
  const bidVolume = toNumber(event.bidSize)
  const askVolume = toNumber(event.askSize)

  const response = {
    result: midPrice,
    data: {
      mid_price: midPrice,
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
