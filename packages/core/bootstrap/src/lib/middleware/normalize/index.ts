import type { Middleware, AdapterRequest, Config, APIEndpoint } from '@chainlink/types'
import { baseInputParameters, Validator } from '../../modules'

export const withNormalizedInput: <C extends Config>(
  endpointSelector?: (request: AdapterRequest) => APIEndpoint<C>,
) => Middleware = (endpointSelector) => async (execute, context) => async (input: AdapterRequest) => {
  const normalizedInput = endpointSelector ? normalizeInput(input, endpointSelector(input)) : input
  return execute(normalizedInput, context)
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
