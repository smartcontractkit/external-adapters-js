import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'

const customParams = {
  base: ['base', 'from', 'coin'],
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toLowerCase()

  const options = {
    ...config.api,
    url: `get_coin/${base}`,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['last_price_usd'])
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
