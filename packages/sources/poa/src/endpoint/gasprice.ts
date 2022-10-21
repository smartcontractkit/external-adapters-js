import { AxiosResponse, Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['gasprice']

export type TInputParameters = { speed: string }
export const inputParameters: InputParameters<TInputParameters> = {
  speed: {
    required: false,
    description: 'The desired speed',
    options: ['slow', 'fast', 'average'],
    default: 'average',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  Requester.logConfig(config)
  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed
  const reqConfig = {
    ...config.api,
  }
  const response: AxiosResponse = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, [speed]) * 1e9
  return Requester.success(jobRunID, response, config.verbose)
}
