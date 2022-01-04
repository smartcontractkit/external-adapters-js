import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'

export const NAME = 'lockedgold' // This should be filled in with a lowercase name corresponding to the API endpoint

const customParams = {}
export interface ResponseSchema {
  grams_locked: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = '/lockedGold'
  const options = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(options)
  const result = await Requester.validateResultNumber(response.data, ['grams_locked'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
