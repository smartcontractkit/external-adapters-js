import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'trueusd'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  field: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const field = validator.validated.data.field || 'totalTrust'
  const url = '/trusttoken/TrueUSD'

  const options = { ...config.api, url }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['responseData', field])

  return Requester.success(jobRunID, response, config.verbose)
}
