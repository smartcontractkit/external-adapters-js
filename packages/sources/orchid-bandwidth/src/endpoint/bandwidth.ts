import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'bandwidth'

const customParams = {
  // No Params
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const options = {
    ...config.api,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, [])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
