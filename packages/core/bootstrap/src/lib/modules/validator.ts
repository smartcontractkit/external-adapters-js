import type {
  AdapterErrorResponse,
  OverrideMap,
  OverrideRecord,
  Includes,
  IncludePair,
  InputParameter,
  InputParameters,
  AdapterRequest,
  AdapterData,
  AdapterRequestData,
  TBaseInputParameters,
  NestableValue,
} from '../../types'
import { merge, cloneDeep } from 'lodash'
import { isArray, isObject } from '../util'
import { AdapterError } from './error'
import presetTokens from '../config/overrides/presetTokens.json'
import { Requester } from './requester'
import { baseInputParameters } from './selector'

const DEFAULT_VALIDATOR_OPTIONS = {
  shouldThrowError: true,
}
export type OverrideType = 'overrides' | 'tokenOverrides' | 'includes'

export interface ValidatedData {
  overrides?: OverrideMap
  tokenOverrides?: OverrideMap
  includes?: Includes[]
}
export interface ValidatorOptions {
  shouldThrowError?: boolean
  includes?: Includes[]
  overrides?: OverrideRecord
}

export type InputOptions<T> = {
  [Property in keyof T]?: unknown[]
}

export class Validator<TInputParameters extends AdapterData> {
  input: AdapterRequest
  inputConfigs: InputParameters<TInputParameters> & InputParameters<TBaseInputParameters>
  inputOptions: InputOptions<TInputParameters & TBaseInputParameters>
  validatorOptions: ValidatorOptions
  validated: AdapterRequest<TInputParameters> & ValidatedData
  error: AdapterError | undefined
  errored: AdapterErrorResponse | undefined

  constructor(
    input: AdapterRequest,
    inputConfigs: InputParameters<TInputParameters>,
    inputOptions: InputOptions<TInputParameters & TBaseInputParameters> = {},
    validatorOptions: ValidatorOptions = {},
  ) {
    this.input = cloneDeep(input)
    this.inputConfigs = {
      ...cloneDeep(inputConfigs),
      ...cloneDeep(baseInputParameters),
    }
    this.inputOptions = cloneDeep(inputOptions)
    this.validatorOptions = {
      ...DEFAULT_VALIDATOR_OPTIONS,
      ...cloneDeep(validatorOptions),
    }
    // Input Data
    this.validated = {
      id: this.input.id,
      data: {} as AdapterRequestData<TInputParameters>,
    }
    this.validateInput()

    // Overrides
    if (this.validatorOptions.overrides)
      this.validateOverrides('overrides', this.validatorOptions.overrides)
    this.validateOverrides('tokenOverrides', presetTokens)
    this.validateIncludeOverrides()
  }

  /**
   * Fill Validator.validated data from input data
   */
  private validateInput(): void {
    try {
      for (const property in this.inputConfigs) {
        const key = property
        const options = this.inputOptions[key]
        const inputConfig = this.inputConfigs[key]

        if (Array.isArray(inputConfig)) {
          // TODO remove alias arrays support once all adapters use InputParameter config type
          const usedKey = this.getUsedKey(key, inputConfig)
          if (!usedKey) return this.throwInvalid(`None of aliases used for required key ${key}`)
          const value = this.input.data[usedKey]
          this.validateRequiredParam(value, key, options)
          continue
        }

        if (typeof inputConfig === 'boolean') {
          // TODO remove required T/F support once all adapters use InputParameter config type
          const value = this.input.data[key]
          inputConfig
            ? this.validateRequiredParam(value, key, options)
            : this.validateOptionalParam(value, key, options)
          continue
        }

        this.validateObjectParam(key, this.validatorOptions.shouldThrowError)
      }
    } catch (e) {
      this.parseError(e)
    }
  }

  validateOverrides(path: 'overrides' | 'tokenOverrides', preset: OverrideRecord): void {
    try {
      const presetMap = overrideObjectToMap(preset)
      if (!this.input.data?.[path]) {
        this.validated[path] = this.formatOverride(presetMap)
        return
      }
      this.validated[path] = this.formatOverride(merge({ ...presetMap }, this.input.data[path]))
    } catch (e) {
      this.parseError(e)
    }
  }

  validateIncludeOverrides(): void {
    try {
      this.validated.includes = this.formatIncludeOverrides([
        ...(Array.isArray(this.input.data?.includes) ? this.input.data.includes : []),
        ...(this.validatorOptions.includes || []),
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

  overrideSymbol = <T extends string | string[]>(adapter: string, symbol: T): T => {
    if (symbol === undefined) throw this.throwInvalid(`Required parameter not supplied: base`)
    if (!this.validated.overrides) return symbol

    if (typeof symbol === 'string') {
      const lowercaseSymbol = symbol.toLowerCase()
      return (
        (this.validated.overrides.get(adapter.toLowerCase())?.get(lowercaseSymbol) as T) || symbol
      )
    }

    if (Array.isArray(symbol)) {
      const multiple = []
      for (const sym of symbol) {
        if (typeof sym === 'string') {
          const overrides = this.validated.overrides.get(adapter.toLowerCase())
          if (!overrides) continue
          const overrided = overrides.get(sym.toLowerCase())
          multiple.push(overrided ?? sym)
        }
      }
      if (multiple.length) return multiple as T
    }

    throw this.throwInvalid(`Symbol overrides can only be done on strings`)
  }

  overrideToken = (symbol: string, network = 'ethereum'): string | undefined => {
    return this.validated.tokenOverrides?.get(network.toLowerCase())?.get(symbol.toLowerCase())
  }

  overrideIncludes = (from: string, to: string): IncludePair | undefined => {
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
    if (!pairs || !pairs[0] || !pairs[0].includes || !pairs[0].includes[0]) {
      return
    }
    return pairs[0].includes[0]
  }

  overrideReverseLookup = (
    adapter: string,
    type: Exclude<OverrideType, 'includes'>,
    symbol: string,
  ): string => {
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

  formatOverride = (param: OverrideMap): OverrideMap => {
    const _throwInvalid = () =>
      this.throwInvalid(`Parameter supplied with wrong format: "override"`)

    if (!isObject(param)) _throwInvalid()

    const _isValid = Object.values(param).every(isObject)
    if (!_isValid) _throwInvalid()

    const _keyToLowerCase = (entry: [string, string]): [string, string] => {
      return [entry[0].toLowerCase(), entry[1]]
    }
    return new Map(
      Object.entries(param)
        .map(_keyToLowerCase)
        .map(([key, value]) => [key, new Map(Object.entries(value).map(_keyToLowerCase))]),
    )
  }

  formatIncludeOverrides = (param: Includes[]): Includes[] => {
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

  validateObjectParam(
    key: keyof TInputParameters | keyof TBaseInputParameters,
    shouldThrowError = true,
  ): void {
    const inputConfig = this.inputConfigs[key] as InputParameter

    const usedKey = this.getUsedKey(key, inputConfig.aliases ?? [])

    const param = usedKey ? this.input.data[usedKey] ?? inputConfig.default : inputConfig.default

    if (shouldThrowError) {
      const paramIsDefined = !(param === undefined || param === null || param === '')

      if (inputConfig.required && !paramIsDefined)
        return this.throwInvalid(`Required parameter ${key} must be non-null and non-empty`)

      if (paramIsDefined) {
        if (inputConfig.type) {
          const primitiveTypes = ['boolean', 'number', 'bigint', 'string']

          if (![...primitiveTypes, 'array', 'object'].includes(inputConfig.type))
            return this.throwInvalid(`${key} parameter has unrecognized type ${inputConfig.type}`)

          if (primitiveTypes.includes(inputConfig.type) && typeof param !== inputConfig.type)
            return this.throwInvalid(`${key} parameter must be of type ${inputConfig.type}`)

          if (inputConfig.type === 'array' && (!Array.isArray(param) || param.length === 0))
            return this.throwInvalid(`${key} parameter must be a non-empty array`)

          if (
            inputConfig.type === 'object' &&
            (!param ||
              Array.isArray(param) ||
              typeof param !== inputConfig.type ||
              Object.keys(param as Record<string, unknown>).length === 0)
          )
            return this.throwInvalid(
              `${key} parameter must be an object with at least one property`,
            )
        }

        if (inputConfig.options) {
          const tolcase = (o: unknown) => (typeof o === 'string' ? o.toLowerCase() : o)

          const formattedOptions = inputConfig.options.map(tolcase)
          const formattedParam = tolcase(param)

          if (!formattedOptions.includes(formattedParam))
            return this.throwInvalid(
              `${key} parameter '${formattedParam}' is not in the set of available options: ${formattedOptions.join(
                ',',
              )}`,
            )
        }

        for (const dependency of inputConfig.dependsOn ?? []) {
          const usedDependencyKey = this.getUsedKey(
            dependency,
            (this.inputConfigs[dependency] as InputParameter).aliases ?? [],
          )
          if (!usedDependencyKey)
            return this.throwInvalid(`${key} dependency ${dependency} not supplied`)
        }

        for (const exclusive of inputConfig.exclusive ?? []) {
          const usedExclusiveKey = this.getUsedKey(
            exclusive,
            (this.inputConfigs[exclusive] as InputParameter).aliases ?? [],
          )
          if (usedExclusiveKey)
            return this.throwInvalid(`${key} cannot be supplied concurrently with ${exclusive}`)
        }
      }
    }

    this.validated.data[key] = param as AdapterRequestData<TInputParameters>[
      | keyof TInputParameters
      | keyof TBaseInputParameters]
  }

  validateOptionalParam(
    value: NestableValue,
    key: keyof TInputParameters | keyof TBaseInputParameters,
    options: unknown[] | undefined,
  ): void {
    if (value && options) {
      if (!Array.isArray(options))
        this.throwInvalid(`Parameter options for ${key} must be of an Array type`)
      if (!options.includes(value))
        this.throwInvalid(`${value} is not a supported ${key} option. Must be one of ${options}`)
    }
    this.validated.data[key] = value as AdapterRequestData<TInputParameters>[
      | keyof TInputParameters
      | keyof TBaseInputParameters]
  }

  validateRequiredParam(
    value: NestableValue,
    key: keyof TInputParameters | keyof TBaseInputParameters,
    options: unknown[] | undefined,
  ): void {
    if (typeof value === 'undefined' || value === '')
      this.throwInvalid(`Required parameter not supplied: ${key}`)
    if (options) {
      if (!Array.isArray(options))
        this.throwInvalid(`Parameter options for ${key} must be of an Array type`)
      if (!options.includes(value))
        this.throwInvalid(
          `${value} is not a supported ${key} option. Must be one of ${options.join(' || ')}`,
        )
    }
    this.validated.data[key] = value as AdapterRequestData<TInputParameters>[
      | keyof TInputParameters
      | keyof TBaseInputParameters]
  }

  getUsedKey(
    key: keyof TInputParameters | keyof TBaseInputParameters | string,
    keyArray: (keyof TInputParameters | keyof TBaseInputParameters | string)[],
  ): string | undefined {
    const comparisonArray = [...keyArray]
    if (!comparisonArray.includes(key)) comparisonArray.push(key)

    const inputParamKeys = Object.keys(this.input.data) as Array<
      Extract<keyof TInputParameters & TBaseInputParameters, string>
    >
    return inputParamKeys.find((k) => comparisonArray.includes(k))
  }
}

const overrideObjectToMap = (override: OverrideRecord): OverrideMap =>
  new Map(
    Object.entries(
      Object.fromEntries(
        Object.entries(override).map(([key, value]) => {
          return [key, new Map(Object.entries(value))]
        }),
      ),
    ),
  )
