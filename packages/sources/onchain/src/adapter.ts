import { ExecuteWithConfig, ExecuteFactory, Config} from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { makeConfig } from './config'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  market: ['market', 'from', 'future'],
}

const commonKeys: Record<string, string> = {
  brent: 'BRN',
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let market = validator.validated.data.market.toLowerCase()
  if (market in commonKeys) market = commonKeys[market]

  const url = `Quote/oil/${market}`

  const headers = {
    'x-api-key': config.apiKey,
  }

  const options = {
    ...config.api,
    url,
    headers,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['price'])
  return Requester.success(jobRunID, response)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
