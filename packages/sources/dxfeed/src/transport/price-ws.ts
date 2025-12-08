import { BaseEndpointTypes } from '../endpoint/price'
import { buildWsTransport } from './ws'

// ["eventSymbol","eventTime","time","timeNanoPart","sequence","exchangeCode","price",
//  "change","size","dayId","dayVolume","dayTurnover","tickDirection","extendedTradingHours"]
const eventSymbolIndex = 0
const timeIndex = 2
const priceIndex = 6

const updatedTime: Record<string, number> = {}

export const transport = buildWsTransport<BaseEndpointTypes>(
  (params): Record<string, string[]>[] => {
    const ticker = params.base.toUpperCase()

    return ticker.includes(':USLF24')
      ? [{ Trade: [ticker] }, { TradeETH: [ticker] }]
      : [{ Trade: [ticker] }]
  },
  (message) => {
    const protocol = Array.isArray(message[0].data[0]) ? message[0].data[0][0] : message[0].data[0]
    if (!['Trade', 'TradeETH'].includes(protocol)) {
      return []
    }

    const base = message[0].data[1][eventSymbolIndex].toString()
    const price = Number(message[0].data[1][priceIndex])
    const time = Number(message[0].data[1][timeIndex])

    // Ignore old messages
    if (updatedTime[base] && updatedTime[base] > time) {
      return []
    }
    updatedTime[base] = time

    return [
      {
        params: { base },
        response: {
          result: price,
          data: {
            result: price,
          },
          timestamps: {
            providerIndicatedTimeUnixMs: time,
          },
        },
      },
    ]
  },
)
