import { AxiosResponse, util, InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { Config } from '../../../config'

export const NAME = 'schedule'

export type TInputParameters = { season: string | number }
export const customParams: InputParameters<TInputParameters> = {
  season: {
    required: true,
    description: 'The season to get events from',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)

  const jobRunID = validator.validated.id
  const season = validator.validated.data.season
  const url = util.buildUrlPath('/nfl/scores/json/Schedules/:season', { season })

  const params = {
    key: config.nflScoresKey,
  }

  const options = { ...config.api, params, url }

  const response: AxiosResponse = await Requester.request(options)
  response.data.result = response.data

  return Requester.success(jobRunID, response, config.verbose)
}
