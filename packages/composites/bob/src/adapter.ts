import { Execute, AdapterResponse, AdapterRequest } from '@chainlink/types'
import { Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { DEFAULT_ENDPOINT } from './config'
import { format } from './endpoint'

const inputParams = {
  endpoint: false
}

// Export function to integrate with Chainlink node
export const execute = async (request: AdapterRequest): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  switch (endpoint.toLowerCase()) {
    case format.NAME: {
      return format.execute(request)
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

export const makeExecute = (): Execute => {
  return async (request: AdapterRequest) => execute(request)
}
