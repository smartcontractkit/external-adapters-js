import { AdapterError, Requester } from '@chainlink/ea-bootstrap'
import { AdapterResponse, RequestConfig } from '@chainlink/types'
import { ResponsePayload, GetPrices } from './types'
import { Logger } from '@chainlink/ea-bootstrap'
import { AdapterRequest } from '@chainlink/types'

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
  source: string,
  jobRunID: string,
  apiConfig: RequestConfig,
): GetPrices => {
  if (source === 'coinpaprika') {
    return sendBatchedRequests(source, jobRunID, apiConfig)
  }
  return sendIndividualRequests(source, jobRunID, apiConfig)
}

export interface BatchedAdapterResponse {
  data: {
    results: (AdapterResponse | number)[][]
  }
}

const sendBatchedRequests =
  (source: string, jobRunID: string, apiConfig: RequestConfig): GetPrices =>
  async (symbols, quote, additionalInput, withMarketCap = false): Promise<ResponsePayload> => {
    const sortedSymbols = symbols.sort()
    const data: AdapterRequest = {
      id: jobRunID,
      data: {
        ...additionalInput,
        base: sortedSymbols,
        quote,
        endpoint: withMarketCap ? 'marketcap' : 'crypto',
      },
    }
    const responseData = await sendRequestToSource<BatchedAdapterResponse>(source, {
      ...apiConfig,
      data,
    })
    const tokenPrices = responseData.data.results

    return sortedSymbols.reduce((response, symbol) => {
      const tokenPrice = tokenPrices.find((priceResponse) => {
        const includesCacheKey = priceResponse.length > 2
        return includesCacheKey
          ? (priceResponse[1] as AdapterResponse).data.base === symbol
          : (priceResponse[0] as AdapterResponse).data.base === symbol
      })
      if (!tokenPrice)
        throw new AdapterError({
          jobRunID,
          statusCode: 500,
          message: `Cannot find token price result for symbol ${symbol}`,
        })

      const tokenPriceIncludesCacheKey = tokenPrice.length > 2
      response[symbol] = {
        quote: {
          [quote]: {
            [withMarketCap ? 'marketCap' : 'price']: tokenPriceIncludesCacheKey
              ? tokenPrice[2]
              : tokenPrice[1],
          },
        },
      }
      return response
    }, {} as ResponsePayload)
  }

const sendIndividualRequests =
  (source: string, jobRunID: string, apiConfig: RequestConfig): GetPrices =>
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
        const responseData = await sendRequestToSource<{ data: { result: number } }>(source, {
          ...apiConfig,
          data,
        })
        return responseData.data.result
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

const sendRequestToSource = async <T>(source: string, request: AdapterRequest): Promise<T> => {
  try {
    const response = await Requester.request<T>(request)
    return response.data
  } catch (error) {
    Logger.error(`Request to ${source} adapter failed: ${error}`)
    throw new Error(
      `Failed to request the ${source} adapter. Ensure that the ${source.toUpperCase()}_ADAPTER_URL environment variable is correctly pointed to the adapter location.`,
    )
  }
}
