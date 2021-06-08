import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { DEFAULT_ENDPOINT, makeConfig } from './config'
import { coin } from './endpoint'

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
    case 'price':
    case coin.NAME: {
      return await coin.execute(request, config)
    }
    case 'marketcap': {
      request.data.path = coin.Paths.MarketCap
      return await coin.execute(request, config)
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

