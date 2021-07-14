import { AdapterError, Requester, Validator } from '.'
import {
  AdapterRequest,
  Config,
  APIEndpoint,
  AdapterResponse,
  InputParameters,
} from '@chainlink/types'

export const inputParameters: InputParameters = {
  endpoint: false,
}

const findSupportedEndpoint = (
  apiEndpoints: Record<string, APIEndpoint>,
  endpoint: string,
): APIEndpoint | null => {
  for (const apiEndpoint of Object.values(apiEndpoints)) {
    // Iterate through supported endpoints of a given Chainlink endpoint
    for (const supportedChainlinkEndpoint of apiEndpoint.supportedEndpoints) {
      if (supportedChainlinkEndpoint.toLowerCase() === endpoint.toLowerCase()) {
        return apiEndpoint
      }
    }
  }
  return null
}

const selectEndpoint = (
  request: AdapterRequest,
  config: Config,
  apiEndpoints: Record<string, APIEndpoint>,
  customParams?: InputParameters,
): APIEndpoint => {
  const params = customParams || inputParameters
  const validator = new Validator(request, params)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || config.defaultEndpoint

  if (!endpoint)
    throw new AdapterError({
      jobRunID,
      message: `Endpoint not supplied and no default found`,
      statusCode: 400,
    })

  let apiEndpoint = findSupportedEndpoint(apiEndpoints, endpoint)

  if (!apiEndpoint)
    throw new AdapterError({
      jobRunID,
      message: `Endpoint ${endpoint} not supported.`,
      statusCode: 400,
    })

  if (apiEndpoint.endpointOverride) {
    const overridenEndpoint = apiEndpoint.endpointOverride(request)
    if (overridenEndpoint) apiEndpoint = findSupportedEndpoint(apiEndpoints, overridenEndpoint)
    if (!apiEndpoint)
      throw new AdapterError({
        jobRunID,
        message: `Overriden Endpoint ${overridenEndpoint} not supported.`,
        statusCode: 500,
      })
  }

  // Allow adapter endpoints to dynamically query different endpoint paths
  if (apiEndpoint.endpointPaths && request.data) {
    const path = apiEndpoint.endpointPaths[endpoint]
    if (typeof path === 'function') request.data.path = path(request)
    else request.data.path = path
  }

  return apiEndpoint
}

const buildSelector = (
  request: AdapterRequest,
  config: Config,
  apiEndpoints: Record<string, APIEndpoint>,
  customParams?: InputParameters,
): Promise<AdapterResponse> => {
  Requester.logConfig(config)

  const apiEndpoint = selectEndpoint(request, config, apiEndpoints, customParams)

  if (typeof apiEndpoint.execute === 'function') {
    return apiEndpoint.execute(request, config)
  }
  if (typeof apiEndpoint.makeExecute === 'function') {
    return apiEndpoint.makeExecute(config)(request)
  }
  throw new AdapterError({
    message: `Internal error: no execute handler found.`,
    statusCode: 500,
  })
}

export const Builder = { selectEndpoint, buildSelector }
