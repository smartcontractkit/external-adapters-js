import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Execute, AdapterResponse, ExecuteWithConfig } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT, Config } from './config'
import { conflux } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (
  request,
  context,
  config,
): Promise<AdapterResponse> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint) {
    case conflux.NAME: {
      return await conflux.execute(request, context, config)
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
  return async (request, context) => execute(request, context, config || makeConfig())
}
