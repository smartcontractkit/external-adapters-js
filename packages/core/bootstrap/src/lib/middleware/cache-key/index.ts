import crypto from 'crypto'
import objectHash from 'object-hash'

import { Validator } from '../../modules/validator'
import { getHashOpts, hash, excludableInternalAdapterRequestProperties } from './util'
import { baseInputParameterKeys, baseInputParameters } from '../../modules/selector'
import { isObject } from '../../util'
import { separateBatches } from '../ws/utils'

import type {
  Middleware,
  AdapterRequest,
  Config,
  APIEndpoint,
  BatchableProperty,
  AdapterData,
  AdapterContext,
} from '../../../types'

const baseInputParametersCachable = Object.keys(baseInputParameters).filter(
  (inputParam) => !excludableInternalAdapterRequestProperties.includes(inputParam),
)

export const withCacheKey: <
  C extends Config = Config,
  D extends AdapterData = AdapterData,
  Ctx extends AdapterContext = AdapterContext,
>(
  endpointSelector?: (request: AdapterRequest<D>) => APIEndpoint<C, D>,
) => Middleware<AdapterRequest<D>, Ctx> =
  (endpointSelector) => async (execute, context) => async (input) => {
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
    const validator = new Validator(
      input,
      endpoint.inputParameters,
      {},
      { shouldThrowError: false },
    )

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
  validatedData: Validator<AdapterData>['validated'],
  inputParameterKeys: string[],
  batchablePropertyPath?: BatchableProperty[],
): string {
  let data = ''

  const inputParameterKeySet = new Set([...baseInputParameterKeys, ...inputParameterKeys])

  for (const key of inputParameterKeySet) {
    // We want the key to be consistent. So we omit batchable paths.
    // Otherwise it would change on every new child
    const isBatchableProperty =
      batchablePropertyPath && batchablePropertyPath.some(({ name }) => key === name)
    // Additionally, we ignore things like overrides that are not relevant to the DP request itself.
    const isExcludableProperty = excludableInternalAdapterRequestProperties.includes(key)
    if (isBatchableProperty || isExcludableProperty) {
      continue
    }

    const value = validatedData.data[key]
    if (!value) continue
    const valueString = isObject(value) ? objectHash(value) : JSON.stringify(value)
    data += valueString
  }

  const shasum = crypto.createHash('sha1')
  shasum.update(data)
  return shasum.digest('base64')
}

export function getBatchChildKeys<C extends Config = Config, D extends AdapterData = AdapterData>(
  input: AdapterRequest,
  endpoint: APIEndpoint<C, D>,
): [string, AdapterRequest][] {
  const children: AdapterRequest[] = []
  separateBatches(input, async (data) => {
    children.push(data)
  })

  return children.map((child) => {
    const inputParameters = endpoint.inputParameters ?? {}
    const inputParameterKeys = Object.keys(inputParameters).concat(baseInputParametersCachable)
    const validator = new Validator(child, inputParameters, {}, { shouldThrowError: false })
    return [getCacheKey(validator.validated, inputParameterKeys), child]
  })
}
