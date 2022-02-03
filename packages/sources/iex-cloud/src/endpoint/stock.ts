import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { ResponseSchema } from './eod'

export const supportedEndpoints = ['stock']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin', 'asset', 'symbol'],
    description: 'The symbol to query',
    required: true,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.overrideSymbol(AdapterName) as string
  const url = `stock/${base.toUpperCase()}/quote`

  const params = {
    token: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    params,
    url,
  }

  const response = await HTTP.request<ResponseSchema>(reqConfig)
  const result = HTTP.validateResultNumber(response.data, ['latestPrice'])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
