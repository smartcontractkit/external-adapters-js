import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['gasprice']

const customError = (data: any) => {
  if (Object.keys(data).length < 1) return true
  if (!('health' in data) || !data.health) return true
  return false
}

export const inputParameters: InputParameters = {
  speed: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'standard'
  const url = `/latest-minimum-gasprice`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, [speed]) * 1e9

  return Requester.success(jobRunID, response, config.verbose)
}
