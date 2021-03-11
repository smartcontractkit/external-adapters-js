import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { Config, AdapterRequest, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { convert } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint) {
    case 'price':
    case convert.Name: {
      const data = await convert.execute(config, request)
      return Requester.success(jobRunID, {
        data,
        status: 200,
      })
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

export const makeExecute: ExecuteFactory<Config> = (config?: Config) => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
