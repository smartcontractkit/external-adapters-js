import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { API_ENDPOINT_MAIN } from '../config'

export const supportedEndpoints = ['height']

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const reqConfig = {
    ...config.api,
    baseURL: config.api.baseURL || API_ENDPOINT_MAIN,
    url: 'q/getblockcount',
  }

  const response = await Requester.request(reqConfig)
  response.data = { result: response.data }

  return Requester.success(jobRunID, response, config.verbose)
}
