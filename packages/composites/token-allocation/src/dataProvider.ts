import { Requester } from '@chainlink/ea-bootstrap'
import { RequestConfig, AdapterRequest, AdapterResponse } from '@chainlink/types'
import { ResponsePayload } from './types'

const batchingSupport: { [name: string]: boolean } = {
  COINGECKO: true,
  COINMARKETCAP: true,
  CRYPTOCOMPARE: true,
  NOMICS: true,
}

const supportsBatch = (source: string, quote: string) =>
  batchingSupport[source.toUpperCase()] ||
  // CoinAPI can only batch USD quotes
  (source.toUpperCase() === 'COINAPI' && quote.toUpperCase() === 'USD')

/**
 * @description
 * A factory that returns a function for getting price or marketcap data from a provider.
 * If the data provider supports batching then it will be sent as a batch request.
 * The response data is normalized to the type ResponsePayload regardless of the type of request.
 *
 * @returns
 * ```
 * {
 *    [symbol: string]: {
 *        quote: {
 *            [symbol: string]: {
 *                price?: number | undefined;
 *                marketCap?: number | undefined;
 *            };
 *        };
 *    };
 *}
 * ```
 */

export const getPriceProvider = (
  jobRunID: string,
  source: string,
  apiConfig: RequestConfig,
) => async (symbols: string[], quote: string, withMarketCap = false): Promise<ResponsePayload> => {
  if (supportsBatch(source, quote)) {
    const data = {
      id: jobRunID,
      data: { base: symbols, quote, endpoint: withMarketCap ? 'marketcap' : 'price' },
    }
    const response = await Requester.request<AdapterResponse>({
      ...apiConfig,
      data: data,
    })
    const payloadEntries = symbols.map((symbol) => {
      const key = symbol
      const val = {
        quote: {
          [quote]: {
            [withMarketCap ? 'marketCap' : 'price']: response.data.data.results.find(
              (result: [AdapterRequest, number]) =>
                result[0].data.base === symbol && result[0].data.quote === quote,
            )[1],
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
