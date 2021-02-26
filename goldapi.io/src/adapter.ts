import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'

export const DEFAULT_API_ENDPOINT = 'https://www.goldapi.io/api/'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  endpoint: false,
}

const customError = (data: Record<string, unknown>) => {
  return data.data === null
}

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix, true)
  config.api.headers['x-access-token'] = config.apiKey
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  return config
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const metal = validator.validated.data.base.toUpperCase()
  const currency = validator.validated.data.quote.toUpperCase()
  const url = `${metal}/${currency}`

  const reqConfig = {
    ...config.api,
    validateStatus: function (status: number) {
      return status >= 200 || status === 400 // default
    },
    url,
  }

  const response = await Requester.request(reqConfig, customError)
  //console.log(response)
  response.data.result = Requester.validateResultNumber(response.data, ['price'])
  return Requester.success(jobRunID, response)
}
