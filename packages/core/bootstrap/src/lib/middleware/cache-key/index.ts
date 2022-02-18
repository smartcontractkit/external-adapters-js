import type { Middleware, AdapterRequest, Config, APIEndpoint } from '@chainlink/types'
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
  const cacheKey = endpointSelector
    ? getCacheKey(input, endpointSelector(input))
    : hash(input, getHashOpts())
  const inputWithCacheKey = { ...input, debug: { ...input.debug, cacheKey } }
  return execute(inputWithCacheKey, context)
}

export function getCacheKey<C extends Config>(
  request: AdapterRequest,
  apiEndpoint: APIEndpoint<C>,
): string {
  const inputParameterKeys = Object.keys(apiEndpoint.inputParameters ?? {}).concat(
    baseInputParametersCachable,
  )
  const validator = new Validator(
    request,
    apiEndpoint.inputParameters,
    {},
    { shouldThrowError: false },
  )

  let cacheKey = ''

  for (const key of inputParameterKeys) {
    const data = JSON.stringify(validator.validated.data[key])
    if (!data) continue
    const shasum = crypto.createHash('sha1')
    shasum.update(data)
    const hash = shasum.digest('base64')
    cacheKey += hash
  }

  const hashedCacheKey = crypto.createHash('sha1').update(cacheKey).digest('base64')
  return hashedCacheKey
}
