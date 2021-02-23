import { Requester } from '@chainlink/external-adapter'
import { ResponsePayload } from '@chainlink/types'
import { PriceAdapter, DataProviderConfig } from './types'

const getPrices = (apiConfig: any, providerConfig: DataProviderConfig) => async (
  symbols: string[],
  quote: string,
  withMarketCap = false,
): Promise<ResponsePayload> => {
  const _getPrices = async (): Promise<ResponsePayload> => {
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
  if (!providerConfig.batchingSupport) {
    return await _getPrices()
  }

  const data = {
    base: symbols,
    quote,
    endpoint: withMarketCap ? 'marketcap' : providerConfig.batchEndpoint || 'price',
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

export const getDataProvider = (
  apiConfig: any,
  providerConfig: DataProviderConfig,
): PriceAdapter => {
  return {
    getPrices: getPrices(apiConfig, providerConfig),
  }
}
