import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BaseEndpointTypes } from '../endpoint/stock-quotes'
import { buildWsTransport } from './ws'

const logger = makeLogger('StockQuotesTransport')

const eventSymbolIndex = 0
const bidTimeIndex = 4
const bidPriceIndex = 6
const bidSizeIndex = 7
const askTimeIndex = 8
const askPriceIndex = 10
const askSizeIndex = 11
const dataLength = 12

export const transport = buildWsTransport<BaseEndpointTypes>(
  (params) => ({ Quote: [params.base.toUpperCase()] }),
  (message) => {
    if (message[0].data[0] != 'Quote' && message[0].data[0][0] != 'Quote') {
      return []
    }

    const data = message[0].data[1]

    if (data.length != dataLength) {
      logger.warn(`${JSON.stringify(data)} is invalid since it doesn't have ${dataLength} fields.`)
      return []
    }

    const bidPrice = Number(data[bidPriceIndex])
    const askPrice = Number(data[askPriceIndex])

    let midPrice: number

    if (bidPrice == 0) {
      midPrice = askPrice
    } else if (askPrice == 0) {
      midPrice = bidPrice
    } else {
      midPrice =
        (bidPrice * Number(data[bidSizeIndex]) + askPrice * Number(data[askSizeIndex])) /
        (Number(data[bidSizeIndex]) + Number(data[askSizeIndex]))
    }

    return [
      {
        params: { base: data[eventSymbolIndex] },
        response: {
          result: null,
          data: {
            mid_price: midPrice,
            bid_price: bidPrice,
            bid_volume: Number(data[bidSizeIndex]),
            ask_price: askPrice,
            ask_volume: Number(data[askSizeIndex]),
          },
          timestamps: {
            providerIndicatedTimeUnixMs: Math.max(
              Number(data[bidTimeIndex]),
              Number(data[askTimeIndex]),
            ),
          },
        },
      },
    ]
  },
)
