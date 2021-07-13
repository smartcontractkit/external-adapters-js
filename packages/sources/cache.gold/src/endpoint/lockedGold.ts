import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'

export const NAME = 'lockedGold' // This should be filled in with a lowercase name corresponding to the API endpoint

const customError = (data: any) => data.Response === 'Error'

const customParams = {}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = '/lockedGold';
  const options = { ...config.api, url }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['grams_locked'])

  return Requester.success(jobRunID, response, config.verbose)
}
