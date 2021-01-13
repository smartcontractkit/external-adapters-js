import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'
import { google } from 'boxhock_google-finance-data'

const commonKeys: Record<string, string> = {
  N225: 'INDEXNIKKEI:NI225',
  FTSE: 'INDEXFTSE:UKX',
}

const inputParams = {
  base: ['base', 'from', 'asset'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id

  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  const data = await google.getSymbol(symbol)
  const result = Requester.validateResultNumber(data, ['ticker'])

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
