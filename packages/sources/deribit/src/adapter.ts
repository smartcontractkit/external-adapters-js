import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'

const customParams = {
  currency: ['base', 'from', 'coin', 'symbol'],
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const currency = validator.validated.data.currency

  const params = { currency }
  const requestConfig = {
    ...config.api,
    params,
    baseUrl: config.api.baseURL
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

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
