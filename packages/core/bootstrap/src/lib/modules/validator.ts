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
} from '@chainlink/types'
import { merge } from 'lodash'
import { isArray, isObject } from '../util'
import { AdapterError } from './error'
import presetSymbols from '../config/overrides/presetSymbols.json'
import presetTokens from '../config/overrides/presetTokens.json'
import presetIncludes from '../config/overrides/presetIncludes.json'
import { Requester } from './requester'
import { baseInputParameters } from './selector'

export type OverrideType = 'overrides' | 'tokenOverrides' | 'includes'

type InputType = {
  id?: string
  data?: any
}
export interface ValidatorOptions {
  shouldThrowError?: boolean
}
export class Validator {
  input: InputType
  inputConfigs: InputParameters
  inputOptions: Record<string, any[]>
  validatorOptions: ValidatorOptions
  validated: any
  error: AdapterError | undefined
  errored: AdapterErrorResponse | undefined
  constructor(
    input: InputType = { id: '1', data: {} },
    inputConfigs = {},
    inputOptions = {},
    validatorOptions: ValidatorOptions = {},
  ) {
    this.input = { ...input }
    if (!this.input.id) this.input.id = '1' //TODO Please remove these once "no any" strict typing is enabled
    if (!this.input.data) this.input.data = {}
    this.inputConfigs = { ...baseInputParameters, ...inputConfigs }
    this.inputOptions = { ...inputOptions }
    this.validatorOptions = { shouldThrowError: true, ...validatorOptions }
    this.validated = { id: this.input.id, data: {} }
    this.validateInput()
    this.validateOverrides('overrides', presetSymbols)
    this.validateOverrides('tokenOverrides', presetTokens)
    this.validateIncludeOverrides()
  }

  validateInput(): void {
    try {
      for (const key in this.inputConfigs) {
        const options = this.inputOptions[key]
        const inputConfig = this.inputConfigs[key]
        if (Array.isArray(inputConfig)) {
          // TODO move away from alias arrays in favor of InputParameter config type
          const usedKey = this.getUsedKey(key, inputConfig)
          if (!usedKey) this.throwInvalid(`None of aliases used for required key ${key}`)
          this.validateRequiredParam(this.input.data[usedKey as string], key, options)
        } else if (typeof inputConfig === 'boolean') {
          // TODO move away from required T/F in favor of InputParameter config type
          inputConfig
            ? this.validateRequiredParam(this.input.data[key], key, options)
            : this.validateOptionalParam(this.input.data[key], key, options)
        } else {
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
    this.errored = Requester.errored(this.validated.id, this.error)
    if (this.validatorOptions.shouldThrowError) {
      throw this.error
    }
  }

  overrideSymbol = (adapter: string, symbol?: string | string[]): string | string[] => {
    const defaultSymbol = symbol || this.validated.data.base
    if (!defaultSymbol) this.throwInvalid(`Required parameter not supplied: base`)
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
    const _throwInvalid = () =>
      this.throwInvalid(`Parameter supplied with wrong format: "override"`)

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
    const _throwInvalid = () =>
      this.throwInvalid(`Parameter supplied with wrong format: "includes"`)
    if (!isArray(param)) _throwInvalid()

    const _isValid = Object.values(param).every((val) => isObject(val) || typeof val === 'string')
    if (!_isValid) _throwInvalid()

    return param
  }

  throwInvalid = (message: string): void => {
    throw new AdapterError({ jobRunID: this.validated.id, statusCode: 400, message })
  }

  validateObjectParam(key: string): void {
    const inputConfig = this.inputConfigs[key] as InputParameter

    const usedKey = this.getUsedKey(key, inputConfig.aliases ?? [])

    const param = usedKey
      ? this.input.data[usedKey as string] ?? inputConfig.default
      : inputConfig.default

    const paramIsDefined = !(param === undefined || param === null || param === '')

    if (inputConfig.required && !paramIsDefined)
      this.throwInvalid(`Required parameter ${key} must be non-null and non-empty`)

    if (paramIsDefined) {
      if (inputConfig.type) {
        const primitiveTypes = ['boolean', 'number', 'bigint', 'string']

        if (![...primitiveTypes, 'array', 'object'].includes(inputConfig.type))
          this.throwInvalid(`${key} parameter has unrecognized type ${inputConfig.type}`)

        if (primitiveTypes.includes(inputConfig.type) && typeof param !== inputConfig.type)
          this.throwInvalid(`${key} parameter must be of type ${inputConfig.type}`)

        if (inputConfig.type === 'array' && (!Array.isArray(param) || param.length === 0))
          this.throwInvalid(`${key} parameter must be a non-empty array`)

        if (
          inputConfig.type === 'object' &&
          (!param ||
            Array.isArray(param) ||
            typeof param !== inputConfig.type ||
            Object.keys(param).length === 0)
        )
          this.throwInvalid(`${key} parameter must be an object with at least one property`)
      }

      if (inputConfig.options && !inputConfig.options.includes(param))
        this.throwInvalid(`${key} parameter is not in the set of available options`)

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
    }

    this.validated.data[key] = param
  }

  validateOptionalParam(param: any, key: string, options: any[]): void {
    if (param && options) {
      if (!Array.isArray(options))
        this.throwInvalid(`Parameter options for ${key} must be of an Array type`)
      if (!options.includes(param))
        this.throwInvalid(`${param} is not a supported ${key} option. Must be one of ${options}`)
    }
    this.validated.data[key] = param
  }

  validateRequiredParam(param: any, key: string, options: any[]): void {
    if (typeof param === 'undefined' || param === '')
      this.throwInvalid(`Required parameter not supplied: ${key}`)
    if (options) {
      if (!Array.isArray(options))
        this.throwInvalid(`Parameter options for ${key} must be of an Array type`)
      if (!options.includes(param))
        this.throwInvalid(
          `${param} is not a supported ${key} option. Must be one of ${options.join(' || ')}`,
        )
    }
    this.validated.data[key] = param
  }

  getUsedKey(key: string, keyArray: string[]): string | undefined {
    const comparisonArray = [...keyArray]
    if (!comparisonArray.includes(key)) comparisonArray.push(key)

    const inputParamKeys = Object.keys(this.input.data)
    return inputParamKeys.find((k) => comparisonArray.includes(k))
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

  const fullParameters = { ...baseInputParameters, ...apiEndpoint.inputParameters }
  const validator = new Validator(request, fullParameters, {}, { shouldThrowError: false })

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
