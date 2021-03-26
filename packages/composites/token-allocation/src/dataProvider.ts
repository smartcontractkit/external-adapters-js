import { Requester } from '@chainlink/ea-bootstrap'
import { RequestConfig } from '@chainlink/types'
import { ResponsePayload } from './types'

export const getPriceProvider = (apiConfig: RequestConfig, jobRunID: string) => async (
  symbols: string[],
  quote: string,
  withMarketCap = false,
): Promise<ResponsePayload> => {
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
