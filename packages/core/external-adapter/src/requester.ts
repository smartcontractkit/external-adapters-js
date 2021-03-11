import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { AdapterError } from './errors'
import { logger } from './logger'
import { getDefaultConfig, logConfig } from './config'
import { AdapterResponse, AdapterErrorResponse } from '@chainlink/types'

const getFalse = () => false

export class Requester {
  static async request(config: AxiosRequestConfig, customError?: any, retries = 3, delay = 1000) {
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

    const _retry = async (n: number): Promise<AxiosResponse> => {
      const _delayRetry = async (message: string) => {
        logger.warn(message)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return await _retry(n - 1)
      }

      let response
      try {
        response = await axios(config)
      } catch (error) {
        // Request error
        if (n === 1) {
          logger.error(`Could not reach endpoint: ${JSON.stringify(error.message)}`)
          throw new AdapterError({ message: error.message, cause: error })
        }

        return await _delayRetry(`Caught error. Retrying: ${JSON.stringify(error.message)}`)
      }

      if (response.data.error || customError(response.data)) {
        // Response error
        if (n === 1) {
          const message = `Could not retrieve valid data: ${JSON.stringify(response.data)}`
          logger.error(message)
          const cause = response.data.error || 'customError'
          throw new AdapterError({ message, cause })
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

  static validateResultNumber(data: { [key: string]: any }, path: (string | number)[]) {
    const result = this.getResult(data, path)
    if (typeof result === 'undefined') {
      const message = 'Result could not be found in path'
      logger.error(message)
      throw new AdapterError({ message })
    }
    if (Number(result) === 0 || isNaN(Number(result))) {
      const message = 'Invalid result'
      logger.error(message)
      throw new AdapterError({ message })
    }
    return Number(result)
  }

  static getResult(data: { [key: string]: any }, path: (string | number)[]): any {
    return path.reduce((o, n) => o[n], data)
  }

  static errored(
    jobRunID = '1',
    error?: AdapterError | Error | string,
    statusCode = 500,
  ): AdapterErrorResponse {
    if (error instanceof AdapterError) {
      error.jobRunID = jobRunID
      return error.toJSONResponse()
    }
    if (error instanceof Error) {
      return new AdapterError({
        jobRunID,
        statusCode,
        message: error.message,
        cause: error,
      }).toJSONResponse()
    }
    return new AdapterError({ jobRunID, statusCode, message: error }).toJSONResponse()
  }

  static success(
    jobRunID = '1',
    response: Partial<AxiosResponse>,
    verbose = false,
  ): AdapterResponse {
    return {
      jobRunID,
      data: verbose ? response.data : { result: response.data?.result },
      result: response.data?.result,
      statusCode: response.status || 200,
    }
  }

  static getDefaultConfig = getDefaultConfig
  static logConfig = logConfig

  static toVendorName = <K, V>(key: K, names: { [key: string]: V }): V => names[String(key)]
}
