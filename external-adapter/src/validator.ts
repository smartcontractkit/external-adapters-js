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
  validated: any
  error: AdapterError | undefined
  errored: AdapterErrorResponse | undefined

  constructor(input = {}, customParams = {}) {
    this.input = input
    this.customParams = customParams
    this.validated = { data: {} }
    this.validateInput()
    this.validateOverrides()
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
          this.validated.data[key] = this.input.data[key]
        }
      }
    } catch (error) {
      this.parseError(error)
    }
  }

  validateOverrides() {
    if (!this.input.data?.overrides) {
      this.validated.overrides = this.formatOverride(presetSymbols)
      return
    }
    try {
      this.validated.overrides = this.formatOverride(
        merge(presetSymbols, this.input.data.overrides),
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

  validateRequiredParam(param: any, key: string) {
    if (typeof param === 'undefined') {
      const message = `Required parameter not supplied: ${key}`
      throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
    } else {
      this.validated.data[key] = param
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
