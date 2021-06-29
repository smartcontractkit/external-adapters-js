import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const field = validator.validated.data.field || 'difficulty'
  const url = `/blocks`

  const options = {
    ...config.api,
    url,
    timeout: 10000,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, [0, field])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
