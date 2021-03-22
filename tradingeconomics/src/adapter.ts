import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { CustomConfig, makeConfig, DEFAULT_ENDPOINT } from './config'
import { markets } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<CustomConfig> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint.toLowerCase()) {
    case 'price':
    case markets.NAME: {
      return await markets.execute(request, config)
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

export const makeExecute: ExecuteFactory<CustomConfig> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
