const axios = require('axios')
const { AdapterError } = require('./adapterError')
const { logger } = require('./logger')

class Requester {
  static request (config, customError, retries = 3, delay = 1000) {
    if (typeof config === 'string') config = { url: config }
    if (typeof config.timeout === 'undefined') {
      const timeout = Number(process.env.TIMEOUT)
      config.timeout = !isNaN(timeout) ? timeout : 3000
    }
    if (typeof customError === 'undefined') {
      customError = function _customError (data) {
        return false
      }
    }
    if (typeof customError !== 'function') {
      delay = retries
      retries = customError
      customError = function _customError (data) {
        return false
      }
    }

    return new Promise((resolve, reject) => {
      const retry = (config, n) => {
        return axios(config)
          .then(response => {
            if (response.data.error || customError(response.data)) {
              if (n === 1) {
                const error = `Could not retrieve valid data: ${JSON.stringify(response.data)}`
                logger.error(error)
                reject(new AdapterError(error))
              } else {
                setTimeout(() => {
                  retries--
                  logger.warn(`Error in response. Retrying: ${JSON.stringify(response.data)}`)
                  retry(config, retries)
                }, delay)
              }
            } else {
              logger.info(`Received response: ${JSON.stringify(response.data)}`)
              return resolve(response)
            }
          })
          .catch(error => {
            if (n === 1) {
              logger.error(`Could not reach endpoint: ${JSON.stringify(error.message)}`)
              reject(new AdapterError(error.message))
            } else {
              setTimeout(() => {
                retries--
                logger.warn(`Caught error. Retrying: ${JSON.stringify(error.message)}`)
                retry(config, retries)
              }, delay)
            }
          })
      }
      return retry(config, retries)
    })
  }

  static validateResultNumber (data, path) {
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

  static getResult (data, path) {
    return path.reduce((o, n) => o[n], data)
  }

  static adapterErrorCallback (jobRunID, error, callback) {
    setTimeout(callback(500, Requester.errored(jobRunID, error)), 0)
  }

  static errored (jobRunID = '1', error = 'An error occurred') {
    return {
      jobRunID,
      status: 'errored',
      error: new AdapterError(error),
      statusCode: 500
    }
  }

  static success (jobRunID = '1', response) {
    if (!('result' in response.data)) {
      response.data.result = null
    }
    return {
      jobRunID,
      data: response.data,
      result: response.data.result,
      statusCode: response.status
    }
  }
}

exports.Requester = Requester
