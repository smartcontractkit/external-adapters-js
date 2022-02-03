import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { ResponseSchema } from './globalMarketCap'

export const supportedEndpoints = ['dominance']

export const description = 'https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest'

export const inputParameters: InputParameters = {
  market: {
    aliases: ['quote', 'to'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id

  const url = 'global-metrics/quotes/latest'

  const options = {
    ...config.api,
    url,
  }

  const symbol = validator.validated.data.market.toLowerCase()
  const dataKey = `${symbol}_dominance`

  const response = await HTTP.request<ResponseSchema>(options)
  const result = HTTP.validateResultNumber(response.data, ['data', dataKey])
  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
