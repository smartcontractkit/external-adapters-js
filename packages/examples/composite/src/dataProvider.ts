import { Requester } from '@chainlink/external-adapter'
import { PriceAdapter, ResponsePayload } from './types'

const getPrices = (apiConfig: any) => async (
  symbols: string[],
  quote: string,
  withMarketCap = false,
): Promise<ResponsePayload> => {
  const results = await Promise.all(
    symbols.map(async (base) => {
      const data = { data: { base, quote, endpoint: withMarketCap ? 'marketcap' : 'price' } }
      const response = await Requester.request({ ...apiConfig, data: data })
      return response.data.result
    }),
  )
  const payloadEntries = symbols.map((symbol, i) => {
    const key = symbol
    const val = {
      quote: {
        [quote]: { [withMarketCap ? 'marketCap' : 'price']: results[i] },
      },
    }
    return [key, val]
  })

  return Object.fromEntries(payloadEntries)
}

export const getDataProvider = (apiConfig: any): PriceAdapter => {
  return {
    getPrices: getPrices(apiConfig),
  }
}
