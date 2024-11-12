import { AxiosResponse, Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Requester, util, Validator } from '@chainlink/ea-bootstrap'

export type TInputParameters = { market: string }
export const inputParameters: InputParameters<TInputParameters> = {
  market: {
    aliases: ['base'],
    required: false,
    type: 'string',
    options: ['brent', 'wti'],
    default: 'brent',
  },
}

export const supportedEndpoints = ['price']

const endpoints: Record<string, string> = {
  brent: 'api',
  wti: 'api/index_cl',
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
  const market = validator.validated.data.market
  const url = util.buildUrlPath('/:endpoint', { endpoint: endpoints[market.toLowerCase()] }, '/')

  const auth = {
    username: '',
    password: config.apiKey || '',
  }

  const reqConfig = {
    ...config.api,
    url,
    auth,
  }

  const response: AxiosResponse = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, ['index'])
  return Requester.success(jobRunID, response, config.verbose)
}
