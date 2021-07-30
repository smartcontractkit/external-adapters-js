import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { util } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'

const customParams = {
  indicator: true,
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  exchange: true,
  interval: true,
}

// TODO: Run tests with valid pro tier + API Key
export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const indicator = validator.validated.data.indicator
  const url = indicator
  const base = validator.validated.data.base.toUpperCase()
  const quote = validator.validated.data.quote.toUpperCase()
  const symbol = `${base}/${quote}`
  const exchange = validator.validated.data.exchange
  const interval = validator.validated.data.interval
  const secret = util.getRandomRequiredEnv('API_KEY')

  const params = {
    secret,
    exchange,
    symbol,
    interval,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['value'])
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
