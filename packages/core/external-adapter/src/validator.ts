import { AdapterErrorResponse, Override } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import { merge } from 'lodash'
import { AdapterError } from './errors'
import { Requester } from './requester'
import { logger } from './logger'
import presetSymbols from './overrides/presetSymbols.json'

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
    this.validateOverrides()
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
      this.parseError(error)
    }
  }

  validateOverrides() {
    try {
      if (!this.input.data?.overrides) {
        this.validated.overrides = this.formatOverride(presetSymbols)
        return
      }
      this.validated.overrides = this.formatOverride(
        merge({ ...presetSymbols }, this.input.data.overrides),
      )
    } catch (e) {
      this.parseError(e)
    }
  }

  parseError(error: any) {
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

  overrideSymbol = (adapter: string, symbol?: string): string => {
    const defaultSymbol = symbol || this.validated.data.base
    if (!defaultSymbol) {
      throw new AdapterError({
        jobRunID: this.validated.id,
        statusCode: 400,
        message: `Required parameter not supplied: base`,
      })
    }
    if (!this.validated.overrides) return defaultSymbol
    return (
      this.validated.overrides.get(adapter.toLowerCase())?.get(defaultSymbol.toLowerCase()) ||
      defaultSymbol
    )
  }

  formatOverride = (param: any): Override => {
    const _throwInvalid = () => {
      const message = `Parameter supplied with wrong format: "overrides"`
      throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
    }
    if (!util.isObject(param)) _throwInvalid()

    const _isValid = Object.values(param).every(util.isObject)
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
        const message = `${param} is not a supported ${key} option. Must be one of ${options.join(
          ' || ',
        )}`
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
