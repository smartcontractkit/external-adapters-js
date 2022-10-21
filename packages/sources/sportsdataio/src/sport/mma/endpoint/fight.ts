import { AxiosResponse, util, InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { Config } from '../../../config'

export const NAME = 'fight'

export type TInputParameters = { fightId: string | number }
export const customParams: InputParameters<TInputParameters> = {
  fightId: {
    required: true,
    type: 'string',
    description: 'The fight ID to query',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)

  const jobRunID = validator.validated.id
  const fightId = validator.validated.data.fightId
  const url = util.buildUrlPath('/mma/stats/json/Fight/:fightId', { fightId })

  const params = {
    key: config.mmaStatsKey,
  }

  const options = { ...config.api, params, url }

  const response: AxiosResponse = await Requester.request(options)
  response.data.result = response.data

  return Requester.success(jobRunID, response, config.verbose)
}
