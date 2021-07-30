import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['globalmarketcap']

export const inputParameters: InputParameters = {}

const customError = (data: any) => data.Response === 'Error'

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, {})
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const url = `/global-ticker`

  const params = {
    key: config.apiKey,
  }

  const reqConfig = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(reqConfig, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['market_cap'])
  return Requester.success(jobRunID, response, config.verbose)
}
