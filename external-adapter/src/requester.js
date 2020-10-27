const axios = require('axios')
const { AdapterError } = require('./errors')
const { logger } = require('./logger')

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
      logger.info(`Received response: ${JSON.stringify(response.data)}`)
      return response
    }

    return await _retry(retries)
  }

  static validateResultNumber(data, path) {
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

  static getResult(data, path) {
    return path.reduce((o, n) => o[n], data)
  }

  static errored(jobRunID = '1', error, statusCode = 500) {
    if (error instanceof AdapterError) return error.toJSONResponse()
    if (error instanceof Error)
      return new AdapterError({ jobRunID, statusCode, cause: error }).toJSONResponse()
    return new AdapterError({ jobRunID, statusCode, message: error }).toJSONResponse()
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
