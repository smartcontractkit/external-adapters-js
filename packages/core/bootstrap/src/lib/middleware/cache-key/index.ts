import type { Middleware, AdapterRequest, Config, APIEndpoint } from '@chainlink/types'
import { Validator } from '../../modules'
import { getHashOpts, hash, excludableInternalAdapterRequestProperties } from './util'
import crypto from 'crypto'
import { baseInputParameterKeys, baseInputParameters } from '../../modules/selector'
import { isObject } from '../../util'
import objectHash from 'object-hash'
import { BatchableProperty } from '../cache-warmer/reducer'
import { separateBatches } from '../ws/utils'

const baseInputParametersCachable = Object.keys(baseInputParameters).filter(
  (inputParam) => !excludableInternalAdapterRequestProperties.includes(inputParam),
)

export const withCacheKey: <C extends Config>(
  endpointSelector?: (request: AdapterRequest) => APIEndpoint<C>,
) => Middleware = (endpointSelector) => async (execute, context) => async (input: AdapterRequest) => {
  const endpoint = endpointSelector?.(input)

  if (!(endpoint && endpoint.inputParameters)) {
    // Fallback to legacy object hash cache key
    const cacheKey = hash(input, getHashOpts())
    const inputWithCacheKey = { ...input, debug: { ...input.debug, cacheKey } }
    return execute(inputWithCacheKey, context)
  }

  const inputParameterKeys = Object.keys(endpoint.inputParameters ?? {}).concat(
    baseInputParametersCachable,
  )
  const validator = new Validator(input, endpoint.inputParameters, {}, { shouldThrowError: false })

  const cacheKey = getCacheKey(validator.validated, inputParameterKeys)

  const batchCacheKey = endpoint.batchablePropertyPath
    ? getCacheKey(validator.validated, inputParameterKeys, endpoint.batchablePropertyPath)
    : undefined

  const batchChildrenCacheKeys = batchCacheKey ? getBatchChildKeys(input, endpoint) : undefined

  const inputWithCacheKey = {
    ...input,
    debug: { ...input.debug, cacheKey, batchCacheKey, batchChildrenCacheKeys },
  }
  return execute(inputWithCacheKey, context)
}

export function getCacheKey(
  validatedData: Validator['validated'],
  inputParameterKeys: string[],
  batchablePropertyPath?: BatchableProperty[],
): string {
  let data = ''

  const inputParameterKeySet = new Set([...baseInputParameterKeys, ...inputParameterKeys])

  for (const key of inputParameterKeySet) {
    // We want the key to be consistent. So we omit batchable paths.
    // Otherwise it would change on every new child
    if (batchablePropertyPath && batchablePropertyPath.some(({ name }) => key === name)) continue

    const value = validatedData.data[key]
    if (!value) continue
    const valueString = isObject(value) ? objectHash(value) : JSON.stringify(value)
    data += valueString
  }

  const shasum = crypto.createHash('sha1')
  shasum.update(data)
  return shasum.digest('base64')
}

export function getBatchChildKeys<C extends Config>(
  input: AdapterRequest,
  endpoint: APIEndpoint<C>,
): [string, AdapterRequest][] {
  const children: AdapterRequest[] = []
  separateBatches(input, async (data) => {
    children.push(data)
  })

  return children.map((child) => {
    const inputParameterKeys = Object.keys(endpoint.inputParameters ?? {}).concat(
      baseInputParametersCachable,
    )
    const validator = new Validator(
      child,
      endpoint.inputParameters,
      {},
      { shouldThrowError: false },
    )
    return [getCacheKey(validator.validated, inputParameterKeys), child]
  })
}
