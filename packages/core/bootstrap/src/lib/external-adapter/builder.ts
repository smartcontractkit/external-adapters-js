import { AdapterError, Requester, Validator} from '.'
import {
    AdapterRequest,
    Config,
} from '@chainlink/types'

const inputParams = {
    endpoint: false,
}

const buildSelector = (request: AdapterRequest, config: Config, apiEndpoints: any) => {
    const validator = new Validator(request, inputParams)
    if (validator.error) throw validator.error

    Requester.logConfig(config)

    const jobRunID = validator.validated.id
    const endpoint = validator.validated.data.endpoint || config.DEFAULT_ENDPOINT

    for(const apiEndpoint of apiEndpoints) {
        for(const supportedChainlinkEndpoint of apiEndpoint.supportedEndpoints) {
            if(supportedChainlinkEndpoint.toLowerCase() === endpoint.toLowerCase()) {
                if(apiEndpoint.makeExecute()) {
                    return apiEndpoint.makeExecute(request, config)
                }
                if (apiEndpoint.execute()){
                    return apiEndpoint.execute(request, config)
                }
                throw new AdapterError({
                    jobRunID,
                    message: `Internal error: no execute handler found.`,
                    statusCode: 400,
                  })
            }
            throw new AdapterError({
                jobRunID,
                message: `Endpoint ${endpoint} not supported.`,
                statusCode: 400,
            })
        }
    }
}

export const Builder = { buildSelector }
