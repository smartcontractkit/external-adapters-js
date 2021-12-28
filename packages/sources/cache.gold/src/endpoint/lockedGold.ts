import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['lockedGold']

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = '/lockedGold'
  const options = { ...config.api, url }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['grams_locked'])

  return Requester.success(jobRunID, response, config.verbose)
}
