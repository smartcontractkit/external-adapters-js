import { BaseEndpointTypes } from '../endpoint/price'
import { buildDxLinkTransport } from './dxlink'
import { LatestTimes, toNumber } from './utils'

// Trade (regular hours) and TradeETH (extended hours) both report the last price; the newest wins
const latestTrades = new LatestTimes()

export const transport = buildDxLinkTransport<BaseEndpointTypes>({
  eventTypes: ['Trade', 'TradeETH'],
  parseEvent: (event) => {
    const base = event.eventSymbol
    const time = toNumber(event.time)
    if (!latestTrades.isLatest(base, time)) {
      return []
    }

    const price = toNumber(event.price)
    if (price === null) {
      return [
        {
          params: { base },
          response: {
            statusCode: 502,
            errorMessage: `Price: ${event.price} for ${base} is invalid.`,
          },
        },
      ]
    }

    return [
      {
        params: { base },
        response: {
          result: price,
          data: { result: price },
          timestamps: { providerIndicatedTimeUnixMs: time ?? undefined },
        },
      },
    ]
  },
})
