import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { DEFAULT_ENDPOINT, makeConfig } from './config'
import { global, price, coins } from './endpoint'

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
    case price.NAME:
      return await price.execute(request, config)
    case 'marketcap':
      request.data.path = price.Paths.MarketCap
      return await price.execute(request, config)
    case 'globalmarketcap':
      request.data.path = 'total_market_cap'
      return await global.execute(request, config)

    case 'dominance':
      request.data.path = 'market_cap_percentage'
      return await global.execute(request, config)

    case coins.NAME:
      return await coins.execute(request, config)

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
