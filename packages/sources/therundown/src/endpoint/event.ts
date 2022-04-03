import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['event']

export const description = 'Returns data for a specific event'

export const inputParameters: InputParameters = {
  eventId: {
    required: true,
    description: 'The ID of the event to query',
    type: 'string',
  },
}

export interface ResponseSchema {
  score: {
    event_status: string
  }
  result: ResponseSchema
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const eventId = validator.validated.data.eventId
  const url = util.buildUrlPath('/events/:eventId', { eventId })

  const reqConfig = {
    ...config.api,
    headers: {
      ...config.api.headers,
      'x-rapidapi-key': config.apiKey,
    },
    params: {
      include: 'scores',
    },
    url,
  }

  const response = await Requester.request<ResponseSchema>(reqConfig)
  response.data.result = { ...response.data }

  return Requester.success(jobRunID, response, config.verbose)
}
