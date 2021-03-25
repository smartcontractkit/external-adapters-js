import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'

const customParams = {
  symbol: ['base', 'from', 'symbol', 'market'],
  to: false,
}

const commonKeys: Record<string, string> = {
  FTSE: 'UK100',
  N225: 'JPN225',
  WTI: 'OIL',
  BRENT: 'UKOIL',
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol.toUpperCase()
  const to = (validator.validated.data.to || '').toUpperCase()
  const currency = (commonKeys[symbol] || symbol) + to

  const params = {
    ...config.api.params,
    currency,
  }

  const options = { ...config.api, params }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, ['quotes', 0, 'mid'])
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
