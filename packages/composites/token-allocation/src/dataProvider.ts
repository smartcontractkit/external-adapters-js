import { Requester } from '@chainlink/ea-bootstrap'
import { RequestConfig } from '@chainlink/types'
import { ResponsePayload } from './types'
import { Logger } from '@chainlink/ea-bootstrap'

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
  (source: string, jobRunID: string, apiConfig: RequestConfig) =>
  async (symbols: string[], quote: string, withMarketCap = false): Promise<ResponsePayload> => {
    const results = await Promise.all(
      symbols.map(async (base) => {
        const data = {
          id: jobRunID,
          data: { base, quote, endpoint: withMarketCap ? 'marketcap' : 'crypto' },
        }
        try {
          const response = await Requester.request({ ...apiConfig, data: data })
          return response.data.result
        } catch (error) {
          Logger.error(`Request to ${source} adapter failed: ${error}`)
          throw new Error(
            `Failed to request the ${source} adapter. Ensure that the ${source.toUpperCase()}_ADAPTER_URL environment variable is correctly pointed to the adapter location.`,
          )
        }
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
