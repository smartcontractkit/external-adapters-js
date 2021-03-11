import { AdapterError } from './errors'
import { Requester } from './requester'
import { logger } from './logger'
import { AdapterErrorResponse } from '@chainlink/types'

export class Validator {
  input: any
  customParams: any
  options: Record<string, any[]>
  validated: any
  error: AdapterError | undefined
  errored: AdapterErrorResponse | undefined

  constructor(input = {}, customParams = {}, options = {}) {
    this.input = input
    this.customParams = customParams
    this.options = options
    this.validated = { data: {} }
    this.validateInput()
  }

  validateInput() {
    this.input.id = this.input.id || '1'
    this.validated.id = this.input.id

    try {
      for (const key in this.customParams) {
        const options = this.options[key]
        if (Array.isArray(this.customParams[key])) {
          this.validateRequiredParam(
            this.getRequiredArrayParam(this.customParams[key]),
            key,
            options,
          )
        } else if (this.customParams[key] === true) {
          this.validateRequiredParam(this.input.data[key], key, options)
        } else if (typeof this.input.data[key] !== 'undefined') {
          this.validateOptionalParam(this.input.data[key], key, options)
        }
      }
    } catch (error) {
      const message = 'Error validating input.'
      if (error instanceof AdapterError) this.error = error
      else
        this.error = new AdapterError({
          jobRunID: this.validated.id,
          statusCode: 400,
          message,
          cause: error,
        })
      logger.error(message, { error: this.error })
      this.errored = Requester.errored(this.validated.id, this.error)
    }
  }

  validateOptionalParam(param: any, key: string, options: any[]) {
    if (param && options) {
      if (!Array.isArray(options)) {
        const message = `Parameter options for ${key} must be of an Array type`
        throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
      }
      if (!options.includes(param)) {
        const message = `${param} is not a supported ${key} option. Must be one of ${options}`
        throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
      }
    }
    this.validated.data[key] = param
  }

  validateRequiredParam(param: any, key: string, options: any[]) {
    if (typeof param === 'undefined') {
      const message = `Required parameter not supplied: ${key}`
      throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
    }
    if (options) {
      if (!Array.isArray(options)) {
        const message = `Parameter options for ${key} must be of an Array type`
        throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
      }
      if (!options.includes(param)) {
        const message = `${param} is not a supported ${key} option. Must be one of ${options}`
        throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
      }
    }
    this.validated.data[key] = param
  }

  getRequiredArrayParam(keyArray: string[]) {
    for (const param of keyArray) {
      if (typeof this.input.data[param] !== 'undefined') {
        return this.input.data[param]
      }
    }
  }
}
