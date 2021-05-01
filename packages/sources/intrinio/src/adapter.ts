import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, Config } from '@chainlink/types'
import { makeConfig } from './config'

export const customParams = {
  base: ['base', 'from', 'asset'],
}

export const execute = async (input: AdapterRequest, config: Config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base.toUpperCase()

  const url = `securities/${symbol}/prices/realtime`
  const params = {
    api_key: config.apiKey,
  }

  const request = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(request)
  response.data.result = Requester.validateResultNumber(response.data, ['last_price'])

  return Requester.success(jobRunID, response)
}

export const makeExecute = (config?: Config) => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
