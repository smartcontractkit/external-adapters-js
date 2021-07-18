import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../../../config'

export const NAME = 'scores'

const customParams = {
  season: true
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const season = validator.validated.data.season
  const url = `/cfb/scores/json/Games/${season}`

  const params = {
    key: config.cfbScoresKey
  }

  const options = { ...config.api, params, url }

  const response = await Requester.request(options)
  response.data.result = response.data

  return Requester.success(jobRunID, response, config.verbose)
}
