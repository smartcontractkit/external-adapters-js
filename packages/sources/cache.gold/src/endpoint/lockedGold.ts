import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['lockedGold']

export const description =
  'Query the total gold grams locked in [cache.gold](https://contract.cache.gold/api/lockedGold).'

export const inputParameters: InputParameters = {}

export interface ResponseSchema {
  grams_locked: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = '/lockedGold'
  const options = { ...config.api, url }

  const response = await HTTP.request<ResponseSchema>(options)
  const result = await HTTP.validateResultNumber(response.data, ['grams_locked'])
  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
