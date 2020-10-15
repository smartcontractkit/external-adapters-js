const axios = require('axios')
const { AdapterError } = require('./adapterError')
const { logger } = require('./logger')

const isObject = (o) => o !== null && typeof o === 'object' && Array.isArray(o) === false
class Requester {
  static async request(config, customError, retries = 3, delay = 1000) {
    if (typeof config === 'string') config = { url: config }
    if (typeof config.timeout === 'undefined') {
      const timeout = Number(process.env.TIMEOUT)
      config.timeout = !isNaN(timeout) ? timeout : 3000
    }

    if (!customError) customError = () => false
    if (typeof customError !== 'function') {
      delay = retries
      retries = customError
      customError = () => false
    }

    const _retry = async (n) => {
      const _delayRetry = async (message) => {
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
          throw new AdapterError(error.message)
        }

        return await _delayRetry(`Caught error. Retrying: ${JSON.stringify(error.message)}`)
      }

      if (response.data.error || customError(response.data)) {
        // Response error
        if (n === 1) {
          const error = `Could not retrieve valid data: ${JSON.stringify(response.data)}`
          logger.error(error)
          throw new AdapterError(error)
        }

        return await _delayRetry(`Error in response. Retrying: ${JSON.stringify(response.data)}`)
      }

      // Success
      logger.info(`Received response: ${JSON.stringify(response.data)}`)
      return response
    }

    return await _retry(retries)
  }

  static validateResultNumber(data, path) {
    const result = this.getResult(data, path)
    if (typeof result === 'undefined') {
      const error = 'Result could not be found in path'
      logger.error(error)
      throw new AdapterError(error)
    }
    if (Number(result) === 0 || isNaN(Number(result))) {
      const error = 'Invalid result'
      logger.error(error)
      throw new AdapterError(error)
    }
    return Number(result)
  }

  static getResult(data, path) {
    return path.reduce((o, n) => o[n], data)
  }

  // TODO: fix error handling, messages are not sent in response
  static errored(jobRunID = '1', error = 'An error occurred', statusCode = 500) {
    const message = error instanceof Error || isObject(error) ? error.message : error
    return {
      jobRunID,
      status: 'errored',
      error: new AdapterError(message || 'An error occurred'),
      statusCode,
    }
  }

  static success(jobRunID = '1', response) {
    if (!('result' in response.data)) {
      response.data.result = null
    }
    return {
      jobRunID,
      data: response.data,
      result: response.data.result,
      statusCode: response.status,
    }
  }
}

exports.Requester = Requester
