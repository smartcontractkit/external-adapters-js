import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, Execute, AdapterRequest, ExecuteWithConfig } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { example } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint.toLowerCase()) {
    case example.NAME: {
      return await example.execute(request, config)
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
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
