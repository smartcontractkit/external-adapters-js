import { AxiosResponse, util, InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { Config } from '../../../config'

export const NAME = 'schedule'

export type TInputParameters = { league: string; season: string | number }
export const customParams: InputParameters<TInputParameters> = {
  league: {
    required: true,
    type: 'string',
    description: 'The league to get events from',
  },
  season: {
    required: true,
    description: 'The season to get events from',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)

  const jobRunID = validator.validated.id
  const league = validator.validated.data.league
  const season = validator.validated.data.season
  const url = util.buildUrlPath('/mma/scores/json/Schedule/:league/:season', { league, season })

  const params = {
    key: config.mmaStatsKey,
  }

  const options = { ...config.api, params, url }

  const response: AxiosResponse = await Requester.request(options)
  response.data.result = response.data

  return Requester.success(jobRunID, response, config.verbose)
}
