import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { DEFAULT_API_ENDPOINT } from '../config'

export const Name = 'difficulty'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const reqConfig = {
    ...config.api,
    baseURL: config.api.baseURL || DEFAULT_API_ENDPOINT,
    url: 'q/getdifficulty',
  }

  const response = await Requester.request(reqConfig)
  response.data = { result: response.data }

  return Requester.success(jobRunID, response, config.verbose)
}
