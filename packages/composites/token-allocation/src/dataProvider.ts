import { Requester } from '@chainlink/ea-bootstrap'
import { RequestConfig } from '@chainlink/types'
import { ResponsePayload } from './types'

const batchingSupport: { [name: string]: boolean } = {
  COINGECKO: true,
  COINMARKETCAP: true,
  CRYPTOCOMPARE: true,
  NOMICS: true,
}

export const getPriceProvider = (
  jobRunID: string,
  source: string,
  apiConfig: RequestConfig,
) => async (symbols: string[], quote: string, withMarketCap = false): Promise<ResponsePayload> => {
  if (batchingSupport[source.toUpperCase()]) {
    const data = {
      id: jobRunID,
      data: { base: symbols, quote, endpoint: withMarketCap ? 'marketcap' : 'price' },
    }
    const response = await Requester.request({ ...apiConfig, data: data })
    const payloadEntries = symbols.map((symbol) => {
      const key = symbol
      const val = {
        quote: {
          [quote]: {
            [withMarketCap ? 'marketCap' : 'price']: response.data.results[quote.toUpperCase()],
          },
        },
      }
      return [key, val]
    })
    return Object.fromEntries(payloadEntries)
  }
  const results = await Promise.all(
    symbols.map(async (base) => {
      const data = {
        id: jobRunID,
        data: { base, quote, endpoint: withMarketCap ? 'marketcap' : 'price' },
      }
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
