import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'ethgasAPI'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  speed: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'average'
  const url = `/api/v1/egs/api/ethgasAPI.json?`

  const options = {
    ...config.api,
    url,
    timeout: 10000,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, [speed]) * 1e8

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
