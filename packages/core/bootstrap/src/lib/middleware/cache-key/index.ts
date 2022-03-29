import type {
  Middleware,
  AdapterRequest,
  Config,
  APIEndpoint,
  InputParameters,
} from '@chainlink/types'
import { Validator } from '../../modules'
import { getHashOpts, hash, excludableInternalAdapterRequestProperties } from './util'
import crypto from 'crypto'
import { baseInputParameters } from '../../modules/selector'

const baseInputParametersCachable = Object.keys(baseInputParameters).filter(
  (inputParam) => !excludableInternalAdapterRequestProperties.includes(inputParam),
)

export const withCacheKey: <C extends Config>(
  endpointSelector?: (request: AdapterRequest) => APIEndpoint<C>,
) => Middleware = (endpointSelector) => async (execute, context) => async (input: AdapterRequest) => {
  const endpoint = endpointSelector?.(input)
  const cacheKey =
    endpoint && endpoint.inputParameters
      ? getCacheKey(input, endpoint.inputParameters)
      : hash(input, getHashOpts()) // Fallback to legacy object hash cache key
  const batchCacheKey =
    endpoint && endpoint.inputParameters && endpoint.batchablePropertyPath
      ? getBatchCacheKey(input, endpoint.inputParameters, endpoint.batchablePropertyPath)
      : undefined
  const inputWithCacheKey = { ...input, debug: { ...input.debug, cacheKey, batchCacheKey } }
  return execute(inputWithCacheKey, context)
}

export function getCacheKey(request: AdapterRequest, inputParameters: InputParameters): string {
  const inputParameterKeys = Object.keys(inputParameters ?? {}).concat(baseInputParametersCachable)
  const validator = new Validator(request, inputParameters, {}, { shouldThrowError: false })

  let data = ''

  for (const key of inputParameterKeys) {
    const value = JSON.stringify(validator.validated.data[key])
    if (!value) continue
    data += value
  }

  const shasum = crypto.createHash('sha1')
  shasum.update(data)
  return shasum.digest('base64')
}

export function getBatchCacheKey(
  request: AdapterRequest,
  inputParameters: InputParameters,
  batchablePropertyPath: unknown[],
): string {
  const inputParameterKeys = Object.keys(inputParameters ?? {}).concat(baseInputParametersCachable)
  const validator = new Validator(request, inputParameters, {}, { shouldThrowError: false })

  let data = ''

  for (const key of inputParameterKeys) {
    // We want the key to be consistent. So we omit batchable paths.
    // Otherwise it would change on every new child
    if (batchablePropertyPath.includes(key)) continue

    const value = JSON.stringify(validator.validated.data[key])
    if (!value) continue
    data += value
  }

  const shasum = crypto.createHash('sha1')
  shasum.update(data)
  return shasum.digest('base64')
}
