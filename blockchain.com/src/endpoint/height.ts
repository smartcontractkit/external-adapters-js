import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, ExecuteWithConfig } from '@chainlink/types'

export const Name = 'height'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  console.log('EXECUTING!')
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const reqConfig = {
    ...config.api,
    baseURL: config.api.baseURL,
    url: 'q/getblockcount',
  }

  const response = await Requester.request(reqConfig)
  const result = response.data

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
