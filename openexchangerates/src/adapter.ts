import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'

const inputParams = {
  base: ['base', 'from'],
  quote: ['quote', 'to'],
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  const base = validator.validated.data.base
  const to = validator.validated.data.quote

  const params = {
    base,
    app_id: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    params,
    url: endpoint,
  }
  const response = await Requester.request(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['rates', to])
  return Requester.success(jobRunID, {
    data: { ...response.data, result },
    result,
    status: 200,
  })
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
