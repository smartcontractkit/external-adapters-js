import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['bandwidth']

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request)

  const jobRunID = validator.validated.id

  const options = {
    ...config.api,
  }

  const response = await HTTP.request<number>(options)
  const result = HTTP.validateResultNumber({ result: response.data }, ['result'])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
