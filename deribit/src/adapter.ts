import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

const customParams = {
  currency: ['base', 'from', 'coin', 'symbol'],
}

export const execute: ExecuteWithConfig = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const currency = validator.validated.data.currency

  const url = 'https://www.deribit.com/api/v2/public/get_historical_volatility'
  const params = { currency }
  const requestConfig = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request(requestConfig)
  const result: number[][] = response.data['result']
  const resultSorted = result.sort((a, b) => {
    if (a.length < 1 || b.length < 1) return 1
    if (a[0] < b[0]) return 1
    if (a[0] > b[0]) return -1
    return 0
  })

  if (resultSorted.length < 1 || resultSorted[0].length < 2) {
    throw new Error('no derbit value')
  }

  response.data.result = Requester.validateResultNumber(resultSorted, [0, 1])
  return Requester.success(jobRunID, response)
}

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
