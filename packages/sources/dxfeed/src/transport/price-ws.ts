import { BaseEndpointTypes } from '../endpoint/price'
import { buildWsTransport } from './ws'

const eventSymbolIndex = 0
const priceIndex = 6

export const transport = buildWsTransport<BaseEndpointTypes>(
  (params) => [{ Trade: [params.base.toUpperCase()] }],
  (message) => {
    if (message[0].data[0] != 'Trade' && message[0].data[0][0] != 'Trade') {
      return []
    }

    const base = message[0].data[1][eventSymbolIndex].toString()
    const price = Number(message[0].data[1][priceIndex])

    return [
      {
        params: { base },
        response: {
          result: price,
          data: {
            result: price,
          },
        },
      },
    ]
  },
)
