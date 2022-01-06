import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['lockedGold']

export const inputParameters: InputParameters = {}

export interface ResponseSchema {
  grams_locked: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = '/lockedGold'
  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = await Requester.validateResultNumber(response.data, ['grams_locked'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
