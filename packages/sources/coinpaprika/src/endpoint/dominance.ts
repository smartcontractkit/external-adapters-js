import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['dominance']

export const description =
  "Returns Bitcoin's dominance from the [global endpoint](https://api.coinpaprika.com/v1/global)"

export const inputParameters: InputParameters = {
  market: {
    aliases: ['to', 'quote'],
    description: 'The symbol of the currency to convert to',
    required: true,
    type: 'string',
  },
}

const convert: { [key: string]: string } = {
  BTC: 'bitcoin',
}

export interface ResponseSchema {
  [key: string]: string | number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = '/v1/global'
  const options = {
    ...config.api,
    url,
  }
  const symbol: string = validator.validated.data.market.toUpperCase()

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, [
    `${convert[symbol]}_dominance_percentage`,
  ])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
