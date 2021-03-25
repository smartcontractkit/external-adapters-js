import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { AdapterRequest, Execute, AdapterResponse } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT, Config } from './config'
import { conflux } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute = async (
  request: AdapterRequest,
  config: Config,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint) {
    case conflux.NAME: {
      return await conflux.execute(request, config)
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

export const makeExecute = (config?: Config): Execute => {
  return async (request) => execute(request, config || makeConfig())
}
