import { Requester } from '@chainlink/ea-bootstrap'
import { RequestConfig } from '@chainlink/types'
import { ResponsePayload } from './types'

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

export const getPriceProvider =
  (jobRunID: string, apiConfig: RequestConfig) =>
  async (symbols: string[], quote: string, withMarketCap = false): Promise<ResponsePayload> => {
    const results = await Promise.all(
      symbols.map(async (base) => {
        const data = {
          id: jobRunID,
          data: { base, quote, endpoint: withMarketCap ? 'marketcap' : 'crypto' },
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
