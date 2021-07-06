import { AdapterError, Requester, Validator} from '.'
import {
    AdapterRequest,
    Config,
} from '@chainlink/types'

const inputParams = {
    endpoint: false,
}

const buildSelector = (request: AdapterRequest, config: Config, apiEndpoints: any, customParams?: any) => {
    const params = customParams || inputParams
    const validator = new Validator(request, params)
    if (validator.error) throw validator.error

    Requester.logConfig(config)

    const jobRunID = validator.validated.id
    const endpoint = validator.validated.data.endpoint || config.defaultEndpoint
    for(const apiEndpoint of apiEndpoints) {
        console.log(apiEndpoint.price)
        for(const supportedChainlinkEndpoint of apiEndpoint.supportedEndpoints) {
            if(supportedChainlinkEndpoint.toLowerCase() === endpoint.toLowerCase()) {
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
