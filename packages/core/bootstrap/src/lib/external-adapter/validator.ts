import {
  AdapterErrorResponse,
  Override,
  AdapterRequest,
  APIEndpoint,
  Includes,
  IncludePair,
  InputParameter,
  InputParameters,
  Config,
  InputParameterAliases,
} from '@chainlink/types'
import { merge } from 'lodash'
import { isArray, isObject } from '../util'
import { AdapterError } from './errors'
import { logger } from './logger'
import presetSymbols from './overrides/presetSymbols.json'
import presetTokens from './overrides/presetTokens.json'
import presetIncludes from './overrides/presetIncludes.json'
import { Requester } from './requester'
import { inputParameters } from './builder'

export type OverrideType = 'overrides' | 'tokenOverrides' | 'includes'

export class Validator {
  input: {
    id?: string
    data?: any
  }
  inputConfigs: InputParameters
  options: Record<string, any[]>
  validated: {
    id: string
    data?: any
    includes?: Override
    overrides?: Override
    tokenOverrides?: Override
  }
  error: AdapterError | undefined
  errored: AdapterErrorResponse | undefined
  shouldLogError: boolean

  constructor(input = {}, inputConfigs = {}, options = {}, shouldLogError = true) {
    this.input = { ...input }
    this.inputConfigs = { ...inputConfigs }
    this.options = { ...options }
    this.shouldLogError = shouldLogError
    this.validated = { id: this.input.id || '1', data: {} }
    this.validateInput()
    this.validateOverrides('overrides', presetSymbols)
    this.validateOverrides('tokenOverrides', presetTokens)
    this.validateIncludeOverrides()
  }

  validateInput(): void {
    try {
      for (const key in this.inputConfigs) {
        const options = this.options[key]
        const inputConfig = this.inputConfigs[key]

        if (Array.isArray(inputConfig)) {
          const usedKey = this.getUsedKey(key, inputConfig)
          if (!usedKey) this.throwInvalid(`None of aliases used for required key ${key}`)()
          this.validateRequiredParam(usedKey as string, options)
        } else if (typeof inputConfig === 'boolean') {
          inputConfig
            ? this.validateRequiredParam(key, options)
            : this.validateOptionalParam(key, options)
        } else if (Object.keys(inputConfig).length > 0) {
          this.validateObjectParam(key)
        }
      }
    } catch (e) {
      this.parseError(e)
    }
  }

  validateOverrides(path: 'overrides' | 'tokenOverrides', preset: Record<string, any>): void {
    try {
      if (!this.input.data?.[path]) {
        this.validated[path] = this.formatOverride(preset)
        return
      }
      this.validated[path] = this.formatOverride(merge({ ...preset }, this.input.data[path]))
    } catch (e) {
      this.parseError(e)
    }
  }

  validateIncludeOverrides(): void {
    try {
      this.validated.includes = this.formatIncludeOverrides([
        ...(this.input.data?.includes || []),
        ...presetIncludes,
      ])
    } catch (e) {
      this.parseError(e)
    }
  }

  parseError(error: Error): void {
    const message = 'Error validating input.'
    if (error instanceof AdapterError) this.error = error
    else
      this.error = new AdapterError({
        jobRunID: this.validated.id,
        statusCode: 400,
        message,
        cause: error,
      })
    if (this.shouldLogError) {
      logger.error(message, {
        error: this.error,
        context: {
          input: this.input,
          options: this.options,
          inputConfigs: this.inputConfigs,
        },
      })
    }
    this.errored = Requester.errored(this.validated.id, this.error)
  }

  overrideSymbol = (adapter: string, symbol?: string | string[]): string | string[] => {
    const defaultSymbol = symbol || this.validated.data.base
    if (!defaultSymbol) this.throwInvalid(`Required parameter not supplied: base`)()
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
    return this.validated.tokenOverrides?.get(network.toLowerCase())?.get(symbol.toLowerCase())
  }

  overrideIncludes = (adapter: string, from: string, to: string): IncludePair | undefined => {
    // Search through `presetIncludes` to find matching override for adapter and to/from pairing.
    const pairs = (
      this.validated.includes?.filter(
        (val: string | Includes) => typeof val !== 'string',
      ) as Includes[]
    ).filter(
      (pair) =>
        pair.from.toLowerCase() === from.toLowerCase() &&
        pair.to.toLowerCase() === to.toLowerCase(),
    )
    for (const pair of pairs) {
      const matchingIncludes = pair.includes.find(
        (include) =>
          !include.adapters ||
          include.adapters.length === 0 ||
          include.adapters.includes(adapter.toUpperCase()),
      )
      if (matchingIncludes) {
        return matchingIncludes
      }
    }
    return
  }

  overrideReverseLookup = (adapter: string, type: OverrideType, symbol: string): string => {
    const overrides: Map<string, string> | undefined = this.validated?.[type]?.get(
      adapter.toLowerCase(),
    )
    if (!overrides) return symbol
    let originalSymbol: string | undefined
    overrides.forEach((overridden, original) => {
      if (overridden.toLowerCase() === symbol.toLowerCase()) originalSymbol = original
    })
    return originalSymbol || symbol
  }

  formatOverride = (param: any): Override => {
    const _throwInvalid = this.throwInvalid(`Parameter supplied with wrong format: "override"`)

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
    const _throwInvalid = this.throwInvalid(`Parameter supplied with wrong format: "includes"`)
    if (!isArray(param)) _throwInvalid()

    const _isValid = Object.values(param).every((val) => isObject(val) || typeof val === 'string')
    if (!_isValid) _throwInvalid()

    return param
  }

  throwInvalid = (message: string) => (): void => {
    throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
  }

  validateObjectParam(key: string): void {
    const inputConfig = this.inputConfigs[key] as InputParameter

    const usedKey = this.getUsedKey(key, inputConfig.aliases ?? [])

    const param = usedKey
      ? this.input.data[usedKey as string] ?? inputConfig.default
      : inputConfig.default

    if (inputConfig.required && (param === undefined || param === null || param === ''))
      this.throwInvalid(`Required parameter ${key} not supplied`)

    if (inputConfig.type && typeof param !== inputConfig.type)
      this.throwInvalid(`${key} parameter must be of type ${inputConfig.type}`)

    if (inputConfig.options && !inputConfig.options.includes(param))
      this.throwInvalid(
        `${key} parameter is not in the set of available options: ${inputConfig.options.join(
          ', ',
        )}`,
      )

    for (const dependency of inputConfig.dependsOn ?? []) {
      const usedDependencyKey = this.getUsedKey(
        dependency,
        (this.inputConfigs[dependency] as InputParameter).aliases ?? [],
      )
      if (!usedDependencyKey) this.throwInvalid(`${key} dependency ${dependency} not supplied`)
    }

    for (const exclusive of inputConfig.exclusive ?? []) {
      const usedExclusiveKey = this.getUsedKey(
        exclusive,
        (this.inputConfigs[exclusive] as InputParameter).aliases ?? [],
      )
      if (usedExclusiveKey)
        this.throwInvalid(`${key} cannot be supplied concurrently with ${exclusive}`)
    }

    this.validated.data[key] = param
  }

  validateOptionalParam(key: string, options: any[]): void {
    const param = this.input.data[key]
    if (param && options) {
      if (!Array.isArray(options))
        this.throwInvalid(`Parameter options for ${key} must be of an Array type`)()
      if (!options.includes(param))
        this.throwInvalid(`${param} is not a supported ${key} option. Must be one of ${options}`)()
    }
    this.validated.data[key] = param
  }

  validateRequiredParam(key: string, options: any[]): void {
    const param = this.input.data[key]
    if (typeof param === 'undefined') this.throwInvalid(`Required parameter not supplied: ${key}`)()
    if (options) {
      if (!Array.isArray(options))
        this.throwInvalid(`Parameter options for ${key} must be of an Array type`)()
      if (!options.includes(param))
        this.throwInvalid(
          `${param} is not a supported ${key} option. Must be one of ${options.join(' || ')}`,
        )()
    }
    this.validated.data[key] = param
  }

  getUsedKey(key: string, keyArray: InputParameterAliases): string | undefined {
    if (!keyArray.includes(key)) keyArray.push(key)

    const inputParamKeys = Object.keys(this.input.data)
    return inputParamKeys.find((k) => keyArray.includes(k))
  }
}

export function normalizeInput<C extends Config>(
  request: AdapterRequest,
  apiEndpoint: APIEndpoint<C>,
): AdapterRequest {
  const input = { ...request }

  // if endpoint does not match, an override occurred and we must adjust it
  if (!apiEndpoint.supportedEndpoints.includes(input.data.endpoint))
    input.data.endpoint = apiEndpoint.supportedEndpoints[0]

  const fullParameters = { ...inputParameters, ...apiEndpoint.inputParameters }
  const validator = new Validator(request, fullParameters)

  // remove undefined values
  const data = JSON.parse(JSON.stringify(validator.validated.data))

  // re-add maxAge
  if (request.data.maxAge) data.maxAge = request.data.maxAge

  // re-add overrides
  if (request.data.overrides) data.overrides = request.data.overrides
  if (request.data.tokenOverrides) data.tokenOverrides = request.data.tokenOverrides
  if (request.data.includes) data.includes = request.data.includes

  if (apiEndpoint.batchablePropertyPath) {
    for (const { name } of apiEndpoint.batchablePropertyPath) {
      const value = data[name]
      if (typeof value === 'string') data[name] = data[name].toUpperCase()
      if (Array.isArray(value)) {
        for (const index in data[name]) data[name][index] = data[name][index].toUpperCase()
      }
    }
  }

  return { ...request, data }
}
