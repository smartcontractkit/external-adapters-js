import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest } from '@chainlink/types'
import { Config, makeConfig } from './config'

export const customParams = {
  base: ['base', 'from', 'asset'],
}

const commonSymbols: { [symbol: string]: string } = {
  N225: 'NKY:IND',
  FTSE: 'UKX:IND',
}

export const execute = async (input: AdapterRequest, config: Config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let symbol = validator.validated.data.base.toUpperCase()
  if (symbol in commonSymbols) {
    symbol = commonSymbols[symbol]
  }

  // Fall back to getting the data from HTTP endpoint
  const url = `/symbol/${symbol}`

  const params = {
    c: `${config.client.key}:${config.client.secret}`,
  }

  const request = {
    ...config.api,
    url,
    params
  }

  const response = await Requester.request(request)
  if (!response.data || response.data.length < 1) {
    throw new Error('no result for query')
  }
  // Replace array by the first object in array
  // to avoid unexpected behavior when returning arrays.
  response.data = response.data[0]

  response.data.result = Requester.validateResultNumber(response.data, ['Last'])
  return Requester.success(jobRunID, response)
}

export const makeExecute = (config?: Config) => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
