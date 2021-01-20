import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { price, global } from './endpoint'

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
    case price.NAME:
      return await price.execute(request, config)

    case 'globalMarketCap':
      request.data.path = 'total_market_cap'
      return await global.execute(request, config)

    case 'dominance':
      request.data.path = 'market_cap_percentage'
      return await global.execute(request, config)

    default:
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
