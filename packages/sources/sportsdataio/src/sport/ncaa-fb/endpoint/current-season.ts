import { AxiosResponse, InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { Config } from '../../../config'

export const NAME = 'current-season'

export type TInputParameters = Record<string, never>
export const customParams: InputParameters<TInputParameters> = {}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)

  const jobRunID = validator.validated.id
  const url = `/cfb/scores/json/CurrentSeason`

  const params = {
    key: config.nflScoresKey,
  }

  const options = { ...config.api, params, url }

  const response: AxiosResponse = await Requester.request(options)
  const result = response.data
  response.data = {
    result,
  }

  return Requester.success(jobRunID, response, config.verbose)
}
