import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { API_ENDPOINT_MAIN } from '../config'

export const Name = 'height'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const reqConfig = {
    ...config.api,
    baseURL: config.api.baseURL || API_ENDPOINT_MAIN,
    url: 'q/getblockcount',
  }

  const response = await Requester.request(reqConfig)
  const result = response.data

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
