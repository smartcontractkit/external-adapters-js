import type { Middleware, AdapterRequest, Config, APIEndpoint } from '@chainlink/types'
import { normalizeInput } from '../../modules'

export const withNormalizedInput: <C extends Config>(
  endpointSelector?: (request: AdapterRequest) => APIEndpoint<C>,
) => Middleware = (endpointSelector) => async (execute, context) => async (input: AdapterRequest) => {
  const normalizedInput = endpointSelector ? normalizeInput(input, endpointSelector(input)) : input
  return execute(normalizedInput, context)
}
