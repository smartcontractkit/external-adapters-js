import { AdapterError, Requester, Validator} from '.'
import {
    AdapterRequest,
    Config,
    APIEndpoint
} from '@chainlink/types'

const inputParams = {
    endpoint: false,
}

const buildSelector = (request: AdapterRequest, config: Config, apiEndpoints: Record<string, APIEndpoint>, customParams?: any) => {
    const params = customParams || inputParams
    const validator = new Validator(request, params)
    if (validator.error) throw validator.error

    Requester.logConfig(config)

    const jobRunID = validator.validated.id
    const endpoint = validator.validated.data.endpoint || config.defaultEndpoint
    for(const apiEndpoint of Object.values(apiEndpoints)) {
        // Allow adapter endpoints to dynamically query different endpoint paths
        if (apiEndpoint.endpointPaths) {
            const path = apiEndpoint.endpointPaths[endpoint]
            if (typeof path === "function")
                request.data.path = path(request)
            else
                request.data.path = path
        }
        // Iterate through supported endpoints of a given Chainlink endpoint
        for(const supportedChainlinkEndpoint of apiEndpoint.supportedEndpoints) {
            if(supportedChainlinkEndpoint.toLowerCase() === endpoint.toLowerCase()) {
                // handle functions that use execute and makeExecute
                if (typeof apiEndpoint.execute === "function"){
                    return apiEndpoint.execute(request, config)
                }
                if(typeof apiEndpoint.makeExecute === "function") {
                    return apiEndpoint.makeExecute(config)(request)
                }
                throw new AdapterError({
                    jobRunID,
                    message: `Internal error: no execute handler found.`,
                    statusCode: 400,
                  })
            }
        }
    }
    throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
    })
}

export const Builder = { buildSelector }
