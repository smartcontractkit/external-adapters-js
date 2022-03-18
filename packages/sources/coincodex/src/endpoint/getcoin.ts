import { AxiosResponse, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['getcoin']

export type TInputParameters = { base: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toLowerCase()

  const options = {
    ...config.api,
    url: `get_coin/${base}`,
  }

  const response: AxiosResponse = await Requester.request(options)

  response.data.result = Requester.validateResultNumber(response.data, ['last_price_usd'])
  return Requester.success(jobRunID, response)
}
