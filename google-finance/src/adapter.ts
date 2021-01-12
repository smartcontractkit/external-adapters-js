import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig } from './config'
// need declaration file in order to import instead of require
const google = require('boxhock_google-finance-data')

const commonKeys: { [key: string]: string } = {
  N225: 'INDEXNIKKEI:NI225',
  FTSE: 'INDEXFTSE:UKX',
}

const inputParams = {
  base: ['base', 'from', 'asset'],
}

export const execute: ExecuteWithConfig = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id

  let symbol = validator.validated.data.base.toUpperCase()
  if (commonKeys[symbol]) {
    symbol = commonKeys[symbol]
  }
  try {
    const data = await google.getSymbol(symbol)
    const result = Requester.validateResultNumber(data, ['ticker'])

    return Requester.success(jobRunID, {
      data: { result },
      result,
      status: 200,
    })
  } catch (err) {
    return Requester.errored(jobRunID, err.message)
  }
}

export const makeExecute: ExecuteFactory = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
