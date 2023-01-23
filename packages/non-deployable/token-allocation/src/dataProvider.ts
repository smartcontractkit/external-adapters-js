import { AdapterConnectionError, Requester, Logger } from '@chainlink/ea-bootstrap'
import type { AxiosRequestConfig } from '@chainlink/ea-bootstrap'
import { ResponsePayload, GetPrices } from './types'

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
  (source: string, jobRunID: string, apiConfig: AxiosRequestConfig): GetPrices =>
  async (symbols, quote, additionalInput, withMarketCap = false): Promise<ResponsePayload> => {
    const results = await Promise.all(
      symbols.map(async (base) => {
        const data = {
          id: jobRunID,
          data: {
            ...additionalInput,
            base,
            quote,
            endpoint: withMarketCap ? 'marketcap' : 'crypto',
          },
        }
        const responseData = await sendRequestToSource<{ result: number }>(source, {
          ...apiConfig,
          data,
        })
        return responseData.result
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

const sendRequestToSource = async <T>(source: string, request: AxiosRequestConfig): Promise<T> => {
  try {
    const response = await Requester.request<T>(request)
    return response.data
  } catch (error) {
    Logger.error(`Request to ${source} adapter failed: ${error}`)
    throw new AdapterConnectionError({
      message: `Failed to request the ${source} adapter. Ensure that the ${source.toUpperCase()}_ADAPTER_URL environment variable is correctly pointed to the adapter location.`,
    })
  }
}
