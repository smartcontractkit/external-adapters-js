import { ExecuteFactory, ExecuteWithConfig} from '@chainlink/types'
import { Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { DEFAULT_ENDPOINT, makeConfig, ExtendedConfig } from './config'
import { format } from './endpoint'

const inputParams = {
  endpoint: false
}

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, config) => {
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

export const makeExecute: ExecuteFactory<ExtendedConfig> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
