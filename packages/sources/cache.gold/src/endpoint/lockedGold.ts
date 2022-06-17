import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['lockedGold']

export const description =
  'Query the total gold grams locked in [cache.gold](https://contract.cache.gold/api/lockedGold).'

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export interface ResponseSchema {
  grams_locked: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = '/lockedGold'
  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = await Requester.validateResultNumber(response.data, ['grams_locked'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
