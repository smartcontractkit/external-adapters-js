import { Requester } from '@chainlink/external-adapter'
import { ResponsePayload } from '@chainlink/types'
import { PriceAdapter } from './types'

const getMarketCaps = (apiConfig: any, withBatching: boolean) => async (
  symbols: string | string[],
  quote: string,
): Promise<ResponsePayload> => {
  return {
    ETH: {
      quote: {
        USD: {
          price: 12,
        },
      },
    },
  }
}

const getPrices = (apiConfig: any, withBatching: boolean) => async (
  symbols: string[],
  quote: string,
): Promise<ResponsePayload> => {
  const _getPrices = async (): Promise<ResponsePayload> => {
    const prices = await Promise.all(
      symbols.map(async (base) => {
        const data = { data: { base, quote } }
        const response = await Requester.request({ ...apiConfig, data: data })
        return response.data.result
      }),
    )
    const payloadEntries = symbols.map((symbol, i) => {
      const key = symbol
      const val = {
        quote: {
          [quote]: { price: prices[i] },
        },
      }
      return [key, val]
    })

    return Object.fromEntries(payloadEntries)
  }
  if (!withBatching) {
    return await _getPrices()
  }

  const data = {
    base: symbols,
    quote,
  }
  const options = {
    ...apiConfig,
    url: '/',
    data: {
      data,
    },
  }
  const result = await Requester.request(options)
  return result.data.data.payload
}

export const getDataProvider = (apiConfig: any, withBatching: boolean): PriceAdapter => {
  return {
    getPrices: getPrices(apiConfig, withBatching),
    getMarketCaps: getMarketCaps(apiConfig, withBatching),
  }
}
