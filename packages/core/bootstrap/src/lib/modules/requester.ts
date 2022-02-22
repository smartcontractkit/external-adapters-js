import {
  AdapterErrorResponse,
  AdapterResponse,
  RequestConfig,
  AdapterRequest,
  AdapterRequestData,
  ResultPath,
} from '@chainlink/types'
import { reducer } from '../middleware/cache-warmer'
import axios, { AxiosResponse } from 'axios'
import { deepType } from '../util'
import { getDefaultConfig, logConfig } from '../config'
import { AdapterError } from './error'
import { logger } from './logger'
import objectPath from 'object-path'
import { join } from 'path'

const getFalse = () => false

const DEFAULT_RETRY = 1

export class Requester {
  static async request<T extends AdapterRequestData>(
    config: RequestConfig,
    customError?: any,
    retries = Number(process.env.RETRY) || DEFAULT_RETRY,
    delay = 1000,
  ): Promise<AxiosResponse<T>> {
    if (typeof config === 'string') config = { url: config }
    if (typeof config.timeout === 'undefined') {
      const timeout = Number(process.env.TIMEOUT)
      config.timeout = !isNaN(timeout) ? timeout : 3000
    }

    if (!customError) customError = getFalse
    if (typeof customError !== 'function') {
      delay = retries
      retries = customError
      customError = getFalse
    }

    const _retry = async (n: number): Promise<AxiosResponse<T>> => {
      const _delayRetry = async (message: string) => {
        logger.warn(message)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return await _retry(n - 1)
      }

      let response: AxiosResponse<T>
      const url = join(config.baseURL || '', config.url || '')
      try {
        response = await axios(config)
      } catch (error) {
        // Request error
        if (n === 1) {
          throw new AdapterError({
            statusCode: 200,
            providerStatusCode: error?.response?.status ?? 0, // 0 -> connection error
            message: error?.message,
            cause: error,
            errorResponse: error?.response?.data?.error,
            url,
          })
        }

        return await _delayRetry(`Caught error. Retrying: ${JSON.stringify(error.message)}`)
      }

      if (response.data.error || customError(response.data)) {
        // Response error
        if (n === 1) {
          const message = `Could not retrieve valid data: ${JSON.stringify(response.data)}`
          const cause = response.data.error || 'customError'
          throw new AdapterError({
            statusCode: 200,
            providerStatusCode: response.data.error?.code ?? response.status,
            message,
            cause,
            url,
          })
        }

        return await _delayRetry(`Error in response. Retrying: ${JSON.stringify(response.data)}`)
      }

      // Success
      const { data, status, statusText } = response
      logger.debug({
        message: 'Received response',
        data,
        status,
        statusText,
      })
      return response
    }

    return await _retry(retries)
  }

  static validateResultNumber(
    data: { [key: string]: any },
    path: ResultPath,
    options?: { inverse?: boolean },
  ): number {
    const result = this.getResult(data, path)
    if (typeof result === 'undefined') {
      const message = 'Result could not be found in path'
      logger.error(message, { data, path })
      throw new AdapterError({ message })
    }
    if (Number(result) === 0 || isNaN(Number(result))) {
      const message = 'Invalid result received'
      logger.error(message, { data, path })
      throw new AdapterError({ message })
    }
    const num = Number(result)
    if (options?.inverse && num != 0) {
      return 1 / num
    }
    return num
  }

  static getResult(data: { [key: string]: unknown }, path: ResultPath): unknown {
    return objectPath.get(data, path)
  }

  /**
   * Extend a typed Axios response with a single result or group of results
   * @param response Axios response object
   * @param result (optional) a single result value
   * @param results (optional) a group of results from a batch request
   */

  static withResult<T>(
    response: AxiosResponse<T>,
    result?: number | string,
    results?: [AdapterRequest, number][],
  ): AxiosResponseWithLiftedResult<T> | AxiosResponseWithPayloadAndLiftedResult<T> {
    const isObj = deepType(response.data) === 'object'
    const output = isObj
      ? (response as AxiosResponseWithLiftedResult<T>)
      : ({
          ...response,
          data: { payload: response.data },
        } as AxiosResponseWithPayloadAndLiftedResult<T>)
    if (result) output.data.result = result
    if (results) output.data.results = results
    return output
  }

  static errored(
    jobRunID = '1',
    error?: AdapterError | Error | string,
    statusCode = 500,
    feedID?: string,
  ): AdapterErrorResponse {
    if (error instanceof AdapterError) {
      error.jobRunID = jobRunID
      if (feedID) {
        error.feedID = feedID
      }
      return error.toJSONResponse()
    }
    if (error instanceof Error) {
      return new AdapterError({
        jobRunID,
        statusCode,
        message: error.message,
        cause: error,
        feedID,
      }).toJSONResponse()
    }
    return new AdapterError({ jobRunID, statusCode, message: error, feedID }).toJSONResponse()
  }

  /**
   * Conforms the .request() response to the expected Chainlink response structure
   * @param jobRunID
   * @param response The response data object
   * @param verbose Return full response data (optional, default: false)
   */
  static success(
    jobRunID = '1',
    response: Partial<AxiosResponse>,
    verbose = false,
    batchablePropertyPath?: reducer.BatchableProperty[],
  ): AdapterResponse {
    const debug = batchablePropertyPath ? { batchablePropertyPath } : undefined

    const adapterResponse = {
      jobRunID,
      data: verbose ? response.data : { result: response.data?.result },
      result: response.data?.result,
      statusCode: 200,
      debug,
    } as AdapterResponse

    if (response.status) {
      adapterResponse.providerStatusCode = response.status
    }

    return adapterResponse
  }

  static getDefaultConfig = getDefaultConfig
  static logConfig = logConfig

  static toVendorName = <K, V>(key: K, names: { [key: string]: V }): V => names[String(key)]
}

/**
 * Contained within the body of an api response
 * from a request that asked for a single data point
 *
 * @example Request Parameters
 * ```
 * {
 *  "data": {
 *      "base": "ETH",
 *      "quote": "USD"
 *   }
 *}
 * ```
 */
interface SingleResult {
  result?: number | string
}

/**
 * Contained within the body of an api response
 * from a request that asked for multiple data points
 *
 * @example Request Parameters
 * ```
 * {
 *  "data": {
 *      "base": "ETH,BTC",
 *      "quote": "USD"
 *   }
 *}
 * ```
 */
interface BatchedResult {
  /**
   * Tuples for
   * [
   *    its input parameters as a single request (used in caching),
   *    its result
   * ]
   */
  results?: [AdapterRequest, number][]
}

/**
 * A lifted result is derived from a raw response,
 * where the response payload will be slightly normalized,
 * "lifting" nested data into the root object
 *
 * @example
 * ```ts
 * // Raw response payload
 * {
 *  payload: {
 *   data: {
 *     nested: {
 *      result: {}
 *     }
 *   }
 *  }
 * // lifted
 *
 * {
 *  data: { results: {}}
 * }
 * ```
 */
type LiftedResult = SingleResult & BatchedResult

/**
 * An Axios response with a result or results added to the response data.
 */
type AxiosResponseWithLiftedResult<T> = AxiosResponse<T & LiftedResult>
/**
 * An Axios response that has response data that is not an object
 * needs to be transformed into an object to hold the result or results fields.
 *
 * The original response data will be store under the key of payload.
 */
type AxiosResponseWithPayloadAndLiftedResult<T> = AxiosResponse<{ payload: T } & LiftedResult>
