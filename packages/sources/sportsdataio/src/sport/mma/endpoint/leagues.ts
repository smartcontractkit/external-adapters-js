import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../../../config'

export const NAME = 'leagues'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = `/mma/scores/json/Leagues`

  const params = {
    key: config.mmaStatsKey
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request(options)
  response.data.result = response.data

  return Requester.success(jobRunID, response, config.verbose)
}
