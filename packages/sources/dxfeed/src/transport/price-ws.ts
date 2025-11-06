import { BaseEndpointTypes } from '../endpoint/price'
import { buildWsTransport } from './ws'

const tickerIndex = 0
const priceIndex = 6

export const transport = buildWsTransport<BaseEndpointTypes>(
  (params) => ({ Quote: [params.base.toUpperCase()] }),
  (message) => {
    const base = message[0].data[1][tickerIndex]
    const price = message[0].data[1][priceIndex]

    return {
      params: { base },
      response: {
        result: price,
        data: {
          result: price,
        },
      },
    }
  },
)
