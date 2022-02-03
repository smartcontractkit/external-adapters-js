import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)

  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base.toUpperCase()
  const currency = validator.validated.data.quote.toUpperCase()

  const params = {
    coin,
    currency,
  }

  const options = {
    ...config.api,
    params,
  }

  const response = await HTTP.request(options)
  response.data.result = HTTP.validateResultNumber(response.data, ['data', 'Price'])
  return HTTP.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
