import { ExecuteFactory, AdapterResponse, AdapterRequest } from '@chainlink/types'
import { Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { DEFAULT_ENDPOINT, makeConfig, Config } from './config'
import { format } from './endpoint'

const inputParams = {
  endpoint: false
}

// Export function to integrate with Chainlink node
export const execute = async (request: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  switch (endpoint.toLowerCase()) {
    case format.NAME: {
      return format.execute(request, config)
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
