const { AdapterError } = require('./adapterError')
const { Requester } = require('./requester')
const { logger } = require('./logger')

class Validator {
  constructor (callback, input = {}, customParams = {}) {
    this.callback = callback
    this.input = input
    this.customParams = customParams
    this.validated = { data: { } }
    this.validateInput(this.callback)
  }

  validateInput (callback) {
    if (typeof this.input.id === 'undefined') {
      this.input.id = '1'
    }
    this.validated.id = this.input.id

    try {
      for (const key in this.customParams) {
        if (Array.isArray(this.customParams[key])) {
          this.validateRequiredParam(this.getRequiredArrayParam(this.customParams[key]), key)
        } else if (this.customParams[key] === true) {
          this.validateRequiredParam(this.input.data[key], key, callback)
        } else {
          if (typeof this.input.data[key] !== 'undefined') {
            this.validated.data[key] = this.input.data[key]
          }
        }
      }
    } catch (error) {
      logger.error(`Error validating input: ${error}`)
      Requester.adapterErrorCallback(this.input.id, error, callback)
    }
  }

  validateRequiredParam (param, key, callback) {
    if (typeof param === 'undefined') {
      const error = `Required parameter not supplied: ${key}`
      logger.error(error)
      throw new AdapterError(error)
    } else {
      this.validated.data[key] = param
    }
  }

  getRequiredArrayParam (keyArray) {
    for (const param of keyArray) {
      if (typeof this.input.data[param] !== 'undefined') {
        return this.input.data[param]
      }
    }
  }
}

exports.Validator = Validator
