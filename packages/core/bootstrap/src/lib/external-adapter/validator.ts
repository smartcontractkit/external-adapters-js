import { AdapterErrorResponse, Override, AdapterRequest, APIEndpoint, Includes } from '@chainlink/types'
import { merge } from 'lodash'
import { isArray, isObject } from '../util'
import { AdapterError } from './errors'
import { logger } from './logger'
import presetSymbols from './overrides/presetSymbols.json'
import presetTokens from './overrides/presetTokens.json'
import presetIncludes from './overrides/presetIncludes.json'
import { Requester } from './requester'
import { inputParameters } from './builder'

export class Validator {
  input: any
  customParams: any
  options: Record<string, any[]>
  validated: any
  error: AdapterError | undefined
  errored: AdapterErrorResponse | undefined

  constructor(input = {}, customParams = {}, options = {}, shouldLogError = true) {
    this.input = { ...input }
    this.customParams = { ...customParams }
    this.options = { ...options }
    this.validated = { data: {} }
    this.validateInput(shouldLogError)
    this.validateOverrides(shouldLogError)
    this.validateTokenOverrides(shouldLogError)
    this.validateIncludeOverrides(shouldLogError)
  }

  validateInput(shouldLogError: boolean) {
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
      this.parseError(
        error,
        {
          input: this.input,
          options: this.options,
          customParams: this.customParams,
        },
        shouldLogError,
      )
    }
  }

  validateOverrides(shouldLogError: boolean) {
    try {
      if (!this.input.data?.overrides) {
        this.validated.overrides = this.formatOverride(presetSymbols)
        return
      }
      this.validated.overrides = this.formatOverride(
        merge({ ...presetSymbols }, this.input.data.overrides),
      )
    } catch (e) {
      this.parseError(
        e,
        {
          input: this.input,
          options: this.options,
          customParams: this.customParams,
        },
        shouldLogError,
      )
    }
  }

  validateTokenOverrides(shouldLogError: boolean) {
    try {
      if (!this.input.data?.tokenOverrides) {
        this.validated.tokenOverrides = this.formatTokenOverrides(presetTokens)
        return
      }
      this.validated.tokenOverrides = this.formatTokenOverrides(
        merge({ ...presetTokens }, this.input.data.tokenOverrides),
      )
    } catch (e) {
      this.parseError(
        e,
        {
          input: this.input,
          options: this.options,
          customParams: this.customParams,
        },
        shouldLogError,
      )
    }
  }

  validateIncludeOverrides(shouldLogError: boolean) {
    try {
      if (!this.input.data || !(this.input.data.to && this.input.data.from)) {
        return
      }
      if (!this.input.data?.includes) {
        this.validated.data.includes = this.formatIncludeOverrides(presetIncludes)
        return
      }
      this.validated.tokenOverrides = this.formatTokenOverrides(
        merge({ ...presetTokens }, this.input.data.tokenOverrides),
      )
    } catch (e) {
      this.parseError(
        e,
        {
          input: this.input,
          options: this.options,
          customParams: this.customParams,
        },
        shouldLogError,
      )
    }
  }

  parseError(error: any, context: any, shouldLogError: boolean) {
    const message = 'Error validating input.'
    if (error instanceof AdapterError) this.error = error
    else
      this.error = new AdapterError({
        jobRunID: this.validated.id,
        statusCode: 400,
        message,
        cause: error,
      })
    if (shouldLogError) {
      logger.error(message, { error: this.error, context })
    }
    this.errored = Requester.errored(this.validated.id, this.error)
  }

  overrideSymbol = (adapter: string, symbol?: string | string[]): string | string[] => {
    const defaultSymbol = symbol || this.validated.data.base
    if (!defaultSymbol) {
      throw new AdapterError({
        jobRunID: this.validated.id,
        statusCode: 400,
        message: `Required parameter not supplied: base`,
      })
    }
    if (!this.validated.overrides) return defaultSymbol
    if (!Array.isArray(defaultSymbol))
      return (
        this.validated.overrides.get(adapter.toLowerCase())?.get(defaultSymbol.toLowerCase()) ||
        defaultSymbol
      )
    const multiple: string[] = []
    for (const sym of defaultSymbol) {
      const overrided = this.validated.overrides.get(adapter.toLowerCase())?.get(sym.toLowerCase())
      if (!overrided) multiple.push(sym)
      else multiple.push(overrided)
    }
    return multiple
  }

  overrideToken = (symbol: string, network = 'ethereum'): string | undefined => {
    if (!this.validated.tokenOverrides) return undefined
    return this.validated.tokenOverrides.get(network.toLowerCase())?.get(symbol.toLowerCase())
  }

  overrideIncludes = (adapter: string, from: string, to: string, includes: Includes[]): Includes | undefined => {
    includes.filter(include =>
      (include.from.toLowerCase() === from.toLowerCase() && include.to.toLowerCase() === to.toLowerCase()) &&
      (!include.adapters || include.adapters.map(adapter => adapter.toLowerCase()).includes(adapter.toLowerCase()))
    )[0]
    // Search through `presetIncludes` to find matching override for adapter and to/from pairing.
    const pairs = presetIncludes.filter(pair => pair.from.toLowerCase() === from.toLowerCase() && pair.to.toLowerCase() === to.toLowerCase())
    for (const pair of pairs) {
      const matchingIncludes = pair.includes
        .find(include => include.adapters.length === 0 || include.adapters.includes(adapter.toUpperCase()))
      if (matchingIncludes) {
        return matchingIncludes
      }
    }
    return
  }

  formatOverride = (param: any): Override => {
    const _throwInvalid = () => {
      const message = `Parameter supplied with wrong format: "overrides"`
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

  formatTokenOverrides = (param: any): Override => {
    const _throwInvalid = () => {
      const message = `Parameter supplied with wrong format: "tokenOverrides"`
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

  formatIncludeOverrides = (param: any): Override => {
    const _throwInvalid = () => {
      const message = `Parameter supplied with wrong format: "includes"`
      throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
    }
    if (!isArray(param)) _throwInvalid()

    const _isValid = Object.values(param).every(val => isObject(val) || typeof val === 'string' )
    if (!_isValid) _throwInvalid()

    return param
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

export function normalizeInput(request: AdapterRequest, apiEndpoint: APIEndpoint): AdapterRequest {
  const input = { ...request }

  // if endpoint does not match, an override occurred and we must adjust it
  if (!apiEndpoint.supportedEndpoints.includes(input.data.endpoint))
    input.data.endpoint = apiEndpoint.supportedEndpoints[0]

  const fullParameters = { ...inputParameters, ...apiEndpoint.inputParameters }
  const validator = new Validator(request, fullParameters)

  // remove undefined values
  const data = JSON.parse(JSON.stringify(validator.validated.data))
  return { ...request, data }
}
