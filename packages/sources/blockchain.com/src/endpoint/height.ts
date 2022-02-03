import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { API_ENDPOINT_MAIN } from '../config'

export const supportedEndpoints = ['height']

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request)

  const jobRunID = validator.validated.id

  const reqConfig = {
    ...config.api,
    baseURL: config.api.baseURL || API_ENDPOINT_MAIN,
    url: 'q/getblockcount',
  }

  const response = await HTTP.request<number>(reqConfig)
  const result = HTTP.validateResultNumber({ result: response.data }, ['result'])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
