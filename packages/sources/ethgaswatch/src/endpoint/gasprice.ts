import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['gasprice']

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  speed: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'fast'
  const url = `/api/gas`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  const result = Requester.validateResultNumber(response.data, [speed, 'gwei'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
