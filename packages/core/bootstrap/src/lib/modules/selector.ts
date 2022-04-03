import { AdapterError, Requester, Validator } from '.'
import {
  AdapterRequest,
  Config,
  APIEndpoint,
  AdapterResponse,
  InputParameters,
  AdapterContext,
  MakeResultPath,
  UpstreamEndpointsGroup,
} from '@chainlink/types'
import { logger } from '../modules'
import { cloneDeep } from 'lodash'

export const baseInputParameters: InputParameters = {
  endpoint: {
    description: 'The External Adapter "endpoint" name to use.',
    required: false,
    type: 'string',
  },

  resultPath: {
    description: 'The path to key into the API response the retrieve the result',
    required: false,
    // type: 'string', TODO: Once multiple types are supported this could be string or array of strings
  },

  overrides: {
    description: 'Override the mapping of token symbols to another token symbol',
    required: false,
    // type: 'string', TODO: Once complex types are supported this could be { [adapter: string]: { [token: string]: string } }
  },
  tokenOverrides: {
    description: 'Override the mapping of token symbols to smart contract address',
    required: false,
    // type: 'string', TODO: Once complex types are supported this could be { [network: string]: { [token: string]: string } }
  },
  includes: {
    description:
      'Override the array of includes that holds additional input parameters when matching a pair of symbols',
    required: false,
    // type: 'string', TODO: Once complex types are supported this could be { from: string, to: string, includes: [{ from: string, to: string, adapters: string[], inverse: boolean, tokens: boolean }] } }[]
  },
}

const findSupportedEndpoint = <C extends Config>(
  apiEndpoints: Record<string, APIEndpoint<C>>,
  endpoint: string,
): APIEndpoint<C> | null => {
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

const selectEndpoint = <C extends Config>(
  request: AdapterRequest,
  config: C,
  apiEndpoints: Record<string, APIEndpoint<C>>,
  customParams?: InputParameters,
): APIEndpoint<C> => {
  const params = customParams || baseInputParameters
  const validator = new Validator(request, params, {}, { shouldThrowError: false })

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || config.defaultEndpoint

  if (!endpoint)
    throw new AdapterError({
      jobRunID,
      message: `Endpoint not supplied and no default found`,
      statusCode: 400,
    })

  let apiEndpoint = findSupportedEndpoint(apiEndpoints, endpoint)

  if (!apiEndpoint && config.defaultEndpoint && endpoint !== config.defaultEndpoint) {
    logger.debug(`Endpoint ${endpoint} not found, trying default ${config.defaultEndpoint}`)
    apiEndpoint = findSupportedEndpoint(apiEndpoints, config.defaultEndpoint)
  }

  if (!apiEndpoint)
    throw new AdapterError({
      jobRunID,
      message: `Endpoint ${endpoint} not supported.`,
      statusCode: 400,
    })

  if (apiEndpoint.endpointOverride) {
    const overridenEndpoint = apiEndpoint.endpointOverride(request)
    if (overridenEndpoint) apiEndpoint = findSupportedEndpoint(apiEndpoints, overridenEndpoint)
    if (request?.data?.endpoint) request.data.endpoint = overridenEndpoint

    if (!apiEndpoint)
      throw new AdapterError({
        jobRunID,
        message: `Overriden Endpoint ${overridenEndpoint} not supported.`,
        statusCode: 500,
      })
  }

  // Allow adapter endpoints to dynamically query different endpoint resultPaths
  if (apiEndpoint.endpointResultPaths && request.data && !request.data.resultPath) {
    const resultPath = apiEndpoint.endpointResultPaths[endpoint]
    if (typeof resultPath === 'function')
      request.data.resultPath = (resultPath as MakeResultPath)(request)
    else request.data.resultPath = resultPath
  }

  return apiEndpoint
}

/**
 *
 * @param request the request coming in to the External Adapter
 * @param downstreamConfig configuration for the downstream adapter (composite)
 * @param downstreamEndpoints endpoints for the downstream adapter (composite)
 * @param upstreamEndpointsGroups endpoint groups for the upstream adapter (source)
 *
 * The following data structure is used:
 *
 * [
 *
 *    input property name of upstream adapter name,
 *
 *    upstream Endpoints mapped to UPPERCASE adapter names,
 *
 *    the endpoint name to select upstream
 *
 * ]
 *
 * @param upstreamConfig configuration for the upstream adapter (source)
 * @param ignoreRequired whether to maintain the required status of input parameters
 * @param customParams additional input parameters to add to the ones defined within the API endpoint
 * @returns
 */
const selectCompositeEndpoint = <ConfigDownstream extends Config, ConfigUpstream extends Config>(
  request: AdapterRequest,
  downstreamConfig: ConfigDownstream,
  downstreamEndpoints: Record<string, APIEndpoint<ConfigDownstream>>,
  upstreamEndpointsGroups: UpstreamEndpointsGroup[],
  upstreamConfig: ConfigUpstream,
  ignoreRequired = false,
  customParams?: InputParameters,
): APIEndpoint<ConfigDownstream> => {
  const downstreamEndpoint = selectEndpoint(
    request,
    downstreamConfig,
    downstreamEndpoints,
    customParams,
  )

  let additionalInputParameters = {}

  for (const [inputPropertyName, adapterMap, upstreamEndpointName] of upstreamEndpointsGroups) {
    const keyFromRequest = request.data[inputPropertyName]
    const upstreamAPIEndpoints = adapterMap[keyFromRequest?.toUpperCase()]

    if (!upstreamAPIEndpoints) {
      logger.warn(
        `The request provided a ${inputPropertyName} of ${keyFromRequest} that was not found while merging upstream input parameters. It may not be supported or may be misconfigured. SKIPPING`,
      )
      continue
    }

    // Modify the endpoint input parameter on the request data to select the upstream endpoint code
    const requestWithUpstreamEndpoint = cloneDeep(request)
    requestWithUpstreamEndpoint.data.endpoint = upstreamEndpointName

    const upstreamEndpoint = selectEndpoint(
      requestWithUpstreamEndpoint,
      upstreamConfig,
      upstreamAPIEndpoints,
      customParams,
    )

    // Note: Ignoring required parameters will lose alias names
    // TODO: this will be handled better once input parameters are refactored to include: default, required, and aliases
    const upstreamInputParameters = ignoreRequired
      ? Object.fromEntries(
          Object.keys(upstreamEndpoint.inputParameters || {}).map((parameter) => [
            parameter,
            false,
          ]),
        )
      : upstreamEndpoint.inputParameters

    additionalInputParameters = {
      ...additionalInputParameters,
      ...upstreamInputParameters,
    }
  }

  // Merge input parameters, favoring the composite input parameters
  downstreamEndpoint.inputParameters = {
    ...downstreamEndpoint.inputParameters,
    ...additionalInputParameters,
  }

  return downstreamEndpoint
}

const buildSelector = <C extends Config>(
  request: AdapterRequest,
  context: AdapterContext,
  config: C,
  apiEndpoints: Record<string, APIEndpoint<C>>,
  customParams?: InputParameters,
): Promise<AdapterResponse> => {
  Requester.logConfig(config)

  const apiEndpoint = selectEndpoint<C>(request, config, apiEndpoints, customParams)

  if (typeof apiEndpoint.execute === 'function') {
    return apiEndpoint.execute(request, context, config)
  }
  if (typeof apiEndpoint.makeExecute === 'function') {
    return apiEndpoint.makeExecute(config)(request, context)
  }
  throw new AdapterError({
    message: `Internal error: no execute handler found.`,
    statusCode: 500,
  })
}

export const Builder = { selectEndpoint, selectCompositeEndpoint, buildSelector }
