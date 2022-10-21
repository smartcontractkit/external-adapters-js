import { AxiosResponse, util, InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { Config } from '../../../config'

export const NAME = 'event'

export type TInputParameters = { eventId: string | number }
export const customParams: InputParameters<TInputParameters> = {
  eventId: {
    required: true,
    type: 'string',
    description: 'The event ID to query',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)

  const jobRunID = validator.validated.id
  const eventId = validator.validated.data.eventId
  const url = util.buildUrlPath('/mma/scores/json/Event/:eventId', { eventId })

  const params = {
    key: config.mmaStatsKey,
  }

  const options = { ...config.api, params, url }

  const response: AxiosResponse = await Requester.request(options)
  response.data.result = response.data

  return Requester.success(jobRunID, response, config.verbose)
}
