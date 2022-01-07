import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['globalmarketcap']

export const inputParameters: InputParameters = {
  market: {
    aliases: ['to', 'quote'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
}

export interface ResponseSchema {
  [key: string]: string | number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = '/v1/global'
  const options = {
    ...config.api,
    url,
  }
  const symbol = validator.validated.data.market.toLowerCase()

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, [`market_cap_${symbol}`])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
