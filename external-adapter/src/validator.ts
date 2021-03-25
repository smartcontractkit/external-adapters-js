import { AdapterError } from './errors'
import { Requester } from './requester'
import { logger } from './logger'
import { AdapterErrorResponse, Override } from '@chainlink/types'

const isObject = (o: unknown): boolean =>
  o !== null && typeof o === 'object' && Array.isArray(o) === false

export class Validator {
  input: any
  customParams: any
  validated: any
  error: AdapterError | undefined
  errored: AdapterErrorResponse | undefined

  constructor(input = {}, customParams = {}) {
    this.input = input
    this.customParams = customParams
    this.validated = { data: {} }
    this.validateInput()
  }

  validateInput() {
    this.input.id = this.input.id || '1'
    this.validated.id = this.input.id

    try {
      for (const key in this.customParams) {
        if (Array.isArray(this.customParams[key])) {
          this.validateRequiredParam(this.getRequiredArrayParam(this.customParams[key]), key)
        } else if (this.customParams[key] === true) {
          this.validateRequiredParam(this.input.data[key], key)
        } else if (typeof this.input.data[key] !== 'undefined') {
          this.validated.data[key] = this.getKeyFormat(key)(this.input.data[key])
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

  formatOverride = (key: string) => (param: any): Override => {
    const _throwInvalid = () => {
      const message = `Required parameter supplied with wrong format: ${key}`
      throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
    }
    if (!isObject(param)) _throwInvalid()

    const _isValid = Object.values(param).every(isObject)
    if (!_isValid) _throwInvalid()

    const _keyToLowerCase = (entry: [string, any]): [string, any] => {
      return [entry[0].toLowerCase(), entry[1]]
    }
    return new Map(
      Object.entries(param)
        .map(_keyToLowerCase)
        .map(([key, value]) => [key, new Map(Object.entries(value).map(_keyToLowerCase))]),
    )
  }

  getKeyFormat(key: string) {
    switch (key.toLowerCase()) {
      case 'overrides': {
        return this.formatOverride(key)
      }
      default:
        return (param: any) => param
    }
  }

  validateRequiredParam(param: any, key: string) {
    if (typeof param === 'undefined') {
      const message = `Required parameter not supplied: ${key}`
      throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
    } else {
      this.validated.data[key] = this.getKeyFormat(key)(param)
    }
  }

  getRequiredArrayParam(keyArray: string[]) {
    for (const param of keyArray) {
      if (typeof this.input.data[param] !== 'undefined') {
        return this.input.data[param]
      }
    }
  }
}
