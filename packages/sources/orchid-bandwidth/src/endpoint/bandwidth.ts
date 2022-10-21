import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['bandwidth']

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id

  const options = {
    ...config.api,
  }

  const response = await Requester.request<number>(options)
  const result = Requester.validateResultNumber({ result: response.data }, ['result'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
