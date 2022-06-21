import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import type {
  ExecuteWithConfig,
  Config,
  InputParameters,
  AxiosResponse,
} from '@chainlink/ea-bootstrap'

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
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toLowerCase()

  const options = {
    ...config.api,
    url: util.buildUrlPath('get_coin/:base', { base }),
  }

  const response: AxiosResponse = await Requester.request(options)

  response.data.result = Requester.validateResultNumber(response.data, ['last_price_usd'])
  return Requester.success(jobRunID, response)
}
