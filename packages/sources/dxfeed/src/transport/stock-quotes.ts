import { BaseEndpointTypes } from '../endpoint/stock-quotes'
import { buildWsTransport } from './ws'

const eventSymbolIndex = 0
const bidPriceIndex = 6
const bidSizeIndex = 7
const askPriceIndex = 10
const askSizeIndex = 11

export const transport = buildWsTransport<BaseEndpointTypes>(
  (params) => ({ Quote: [params.base.toUpperCase()] }),
  (message) => {
    if (message[0].data[0] != 'Quote' && message[0].data[0][0] != 'Quote') {
      return []
    }

    const data = message[0].data[1]

    return [
      {
        params: { base: data[eventSymbolIndex] },
        response: {
          result: null,
          data: {
            bid_price: Number(data[bidPriceIndex]),
            bid_volume: Number(data[bidSizeIndex]),
            ask_price: Number(data[askPriceIndex]),
            ask_volume: Number(data[askSizeIndex]),
          },
        },
      },
    ]
  },
)
