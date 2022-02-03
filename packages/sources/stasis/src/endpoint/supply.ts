import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { HTTP, Validator } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['supply']

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = '/transparency/eurs-statement'

  const options = {
    ...config.api,
    url,
  }

  const response = await HTTP.request(options)
  response.data.result = HTTP.validateResultNumber(response.data, ['amount'])
  return HTTP.success(jobRunID, response)
}
