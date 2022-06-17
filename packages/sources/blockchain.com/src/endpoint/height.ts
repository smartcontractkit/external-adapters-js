import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { API_ENDPOINT_MAIN } from '../config'

export const supportedEndpoints = ['height']

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id

  const reqConfig = {
    ...config.api,
    baseURL: config.api?.baseURL || API_ENDPOINT_MAIN,
    url: 'q/getblockcount',
  }

  const response = await Requester.request<number>(reqConfig)
  const result = Requester.validateResultNumber({ result: response.data }, ['result'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
