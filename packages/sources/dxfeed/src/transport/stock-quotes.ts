import { BaseEndpointTypes } from '../endpoint/stock-quotes'
import { buildDxLinkTransport, DxLinkEvent } from './dxlink'
import { LatestTimes, toNumber } from './utils'

// Overnight quotes also feed regular requests, so each session keeps its own latest quote
const latestQuotes = new LatestTimes()

export const transport = buildDxLinkTransport<BaseEndpointTypes>({
  eventTypes: ['Quote'],
  parseEvent: (event) => {
    const base = event.eventSymbol
    const time = toNumber(event.time)
    // isOvernight requests only accept quotes from the overnight venue (exchange code O)
    const isOvernightQuote = event.bidExchangeCode === 'O' && event.askExchangeCode === 'O'
    const sessions = isOvernightQuote ? [false, true] : [false]
    const { response, requireVolumeResponse } = buildResponses(event, time)

    return sessions
      .filter((isOvernight) => latestQuotes.isLatest(`${base}:${isOvernight}`, time))
      .flatMap((isOvernight) => [
        { params: { base, isOvernight, requireVolume: false }, response },
        { params: { base, isOvernight, requireVolume: true }, response: requireVolumeResponse },
      ])
  },
})

const buildResponses = (event: DxLinkEvent, time: number | null) => {
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
    timestamps: { providerIndicatedTimeUnixMs: time ?? undefined },
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
