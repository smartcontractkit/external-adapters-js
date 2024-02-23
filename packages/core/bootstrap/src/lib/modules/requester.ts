import axios, { AxiosError, AxiosResponse } from 'axios'
import objectPath from 'object-path'
import { join } from 'path'

import {
  deepType,
  getEnv,
  getEnvWithFallback,
  parseBool,
  sleep,
  isObject,
  isArraylikeAccessor,
} from '../util'
import {
  AdapterConnectionError,
  AdapterCustomError,
  AdapterDataProviderError,
  AdapterError,
  AdapterResponseEmptyError,
  AdapterResponseInvalidError,
  AdapterTimeoutError,
} from './error'
import { logger } from './logger'
import { getDefaultConfig, logConfig } from '../config'
import { recordDataProviderRequest } from '../metrics'

import type {
  AdapterErrorResponse,
  BatchedResult,
  AdapterResponse,
  AxiosRequestConfig,
  AdapterBatchResponse,
  ResultPath,
  BatchableProperty,
} from '../../types'

export type CustomErrorReturnValue = boolean | string
type CustomError<T = unknown> = (data: T) => CustomErrorReturnValue
const defaultCustomError = () => false

export class Requester {
  // used to return consistent error messages when failing with or without a customError
  static generateErrorMessage<T>(
    config: AxiosRequestConfig,
    response?: AxiosResponse<T>,
    append?: string,
    customErrorResult?: CustomErrorReturnValue,
  ): string {
    const { baseURL, url, data, params } = config // strip noisy and sensitive data from axios config before logging/including in the response

    return (
      `Could not retrieve valid data from Data Provider. This is likely an issue with the Data Provider or the input params/overrides.` +
      `${
        customErrorResult && typeof customErrorResult === 'string'
          ? ` Message: ${customErrorResult}.`
          : ''
      }` +
      ` Request: ${JSON.stringify({ baseURL, url, data, params })},` +
      ` Response: ${JSON.stringify(response?.data || {})}.` +
      `${append ? ` ${append}` : ''}`
    )
  }

  static async request<T>(
    config: AxiosRequestConfig,
    customError = defaultCustomError as CustomError<T>,
    retries = Number(getEnv('RETRY')),
    delay = 1000,
  ): Promise<AxiosResponse<T>> {
    if (typeof config.timeout === 'undefined') {
      const timeout = Number(getEnv('TIMEOUT'))
      config.timeout = !isNaN(timeout) ? timeout : 3000
    }

    const _retry = async (n: number): Promise<AxiosResponse<T>> => {
      const _delayRetry = async (message: string) => {
        logger.warn(message)
        await sleep(delay)
        return await _retry(n - 1)
      }

      let response: AxiosResponse<T>
      const url = join(config.baseURL || '', config.url || '')
      const record = recordDataProviderRequest()
      try {
        const startTime = process.hrtime.bigint()

        response = await axios(config)

        const endTime = process.hrtime.bigint()
        const milliseconds = (endTime - startTime) / 1000000n
        response.headers['ea-dp-request-duration'] = milliseconds.toString()
      } catch (e: any) {
        const error = e as AxiosError
        // Request error
        if (error.code === 'ECONNABORTED') {
          const providerStatusCode: number | undefined = error?.response?.status ?? 504
          record(config.method, providerStatusCode)
          // Axios timeout code
          throw new AdapterTimeoutError({
            statusCode: 504,
            name: 'Data Provider Request Timeout error',
            providerStatusCode,
            message: error?.message,
            cause: error,
            errorResponse: error?.response?.data?.error,
            url,
          })
        }

        if (n <= 1) {
          // Exhausted retries, respond with an error
          const providerStatusCode = error?.response?.status ?? 0 // 0 -> connection error
          record(config.method, providerStatusCode)
          const errorInput = {
            statusCode: 200,
            providerStatusCode,
            message: error?.message,
            cause: error,
            errorResponse: error?.response?.data?.error,
            url,
          }
          if (providerStatusCode === 0) {
            throw new AdapterConnectionError(errorInput)
          } else {
            throw new AdapterDataProviderError(errorInput)
          }
        }

        return await _delayRetry(
          Requester.generateErrorMessage(config, error.response, error.message),
        )
      }

      const customErrorResult = customError && customError(response.data) // customError is string | bool, consider it hit if true or defined
      if (response.data && customErrorResult) {
        const message = Requester.generateErrorMessage(
          config,
          response,
          undefined,
          customErrorResult,
        )
        if (n <= 1) {
          // Exhausted retries, respond with an error
          const cause = (response.data as T & { error: Error | undefined }).error
          const providerStatusCode: number | undefined =
            (response.data as T & { error: { code: number } }).error?.code ?? response.status
          record(config.method, providerStatusCode)
          const errorPayload = {
            statusCode: 200,
            providerStatusCode,
            message,
            cause,
            url,
          }
          throw (response.data as T & { error: Error | undefined }).error
            ? new AdapterDataProviderError(errorPayload)
            : new AdapterCustomError(errorPayload)
        }
        // Dump the provider response and optionally a customError message to console, then retry
        return await _delayRetry(message)
      }

      // Success
      const { data, status, statusText } = response
      record(config.method, status)
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

  static validateResultNumber<T extends unknown>(
    data: T,
    path?: ResultPath,
    options?: { inverse?: boolean; acceptZeroValue?: boolean },
    missingDataErrorMsg = 'Data provider response empty',
    missingResultsErrorMsg = 'Result could not be found in path or is empty. This is likely an issue with the data provider or the input params/overrides.',
  ): number {
    if (
      typeof data === 'undefined' ||
      data === null ||
      (isObject(data) && Object.keys(data as Record<string, unknown>).length === 0)
    ) {
      logger.error(missingDataErrorMsg, { data, path })
      throw new AdapterResponseEmptyError({
        message: missingDataErrorMsg,
        statusCode: 502,
      })
    }
    const result = path ? this.getResult(data, path) : data

    if (typeof result === 'undefined' || result === null) {
      logger.error(missingResultsErrorMsg, { data, path })
      throw new AdapterResponseInvalidError({
        message: missingResultsErrorMsg,
        statusCode: 502,
      })
    }

    const invalidZeroValue = !options?.acceptZeroValue && Number(result) === 0
    if (invalidZeroValue || isNaN(Number(result))) {
      const message =
        'Invalid result received. This is likely an issue with the data provider or the input params/overrides.'
      logger.error(message, { data, path })
      throw new AdapterResponseInvalidError({
        message,
        statusCode: 400,
      })
    }
    const num = Number(result)
    if (options?.inverse && num != 0) return 1 / num
    return num
  }

  static getResult<T extends unknown>(data: T, path: ResultPath): unknown {
    if (
      (typeof data === 'string' || Array.isArray(data)) &&
      Array.isArray(path) &&
      isArraylikeAccessor(path)
    )
      return this.getResultFromArraylike(data, path)

    // object-path handles accessing arrays, just need to coerce the type
    return this.getResultFromObject(data as Record<string, T[keyof T]>, path)
  }

  static getResultFromObject<T extends Record<string, T[keyof T]>>(
    data: T,
    path: ResultPath,
  ): unknown {
    return objectPath.get(data, path)
  }

  static getResultFromArraylike<T extends string | ArrayLike<unknown>>(
    data: T,
    path: [number],
  ): unknown {
    return data[path[0]]
  }

  /**
   * Extend a typed Axios response with a single result or group of results
   * @param response Axios response object
   * @param result (optional) a single result value
   * @param results (optional) a group of results from a batch request
   */

  static withResult<T extends Record<string, unknown> | unknown>(
    response: AxiosResponse<T>,
    result?: number | string,
    results?: AdapterBatchResponse,
  ): AxiosReponseWithResult<T> {
    const isObj = deepType(response.data) === 'object'
    if (isObj) {
      const output = response as AxiosReponseWithResult<T>
      if (result) output.data.result = result
      if (results) output.data.results = results
      return output
    }
    const output = {
      ...response,
      data: { payload: response.data },
    } as AxiosReponseWithResult<T>
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
    batchablePropertyPath?: BatchableProperty[],
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

    if (parseBool(getEnv('TELEMETRY_DATA_ENABLED'))) {
      adapterResponse.telemetry = {
        rateLimitEnabled: parseBool(getEnv('RATE_LIMIT_ENABLED')),
        wsEnabled: parseBool(getEnv('WS_ENABLED')),
        cacheEnabled: parseBool(getEnv('CACHE_ENABLED')),
        cacheType: getEnv('CACHE_TYPE'),
        cacheWarmingEnabled: parseBool(getEnv('WARMUP_ENABLED')),
        cacheMaxAge: getEnv('CACHE_MAX_AGE'),
        metricEnabled: parseBool(
          getEnvWithFallback('METRICS_ENABLED', ['EXPERIMENTAL_METRICS_ENABLED']),
        ),
        rateLimitApiTier: getEnv('RATE_LIMIT_API_TIER'),
        requestCoalescingEnabled: parseBool(getEnv('REQUEST_COALESCING_ENABLED')),
      }

      if (response?.headers && response.headers['ea-dp-request-duration']) {
        adapterResponse.telemetry.dataProviderRequestTime = Number(
          response.headers['ea-dp-request-duration'],
        )
      }
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

type AxiosReponseWithResult<T extends Record<string, unknown> | unknown> = T extends Record<
  string,
  unknown
>
  ? AxiosResponseWithLiftedResult<T>
  : AxiosResponseWithPayloadAndLiftedResult<T>
