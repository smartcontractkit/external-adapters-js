import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

const customError = (data: any) => data.Response === 'Error'

export const supportedEndpoints = ['height', 'difficulty']

const customParams = {
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  request.data.field = validator.validated.data.endpoint || config.defaultEndpoint
  const field = validator.validated.data.field || 'difficulty'
  const url = `/blocks`

  const options = {
    ...config.api,
    url,
    timeout: 10000,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, [0, field])

  return Requester.success(jobRunID, response, config.verbose)
}
