import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['total-score']

export const inputParameters: InputParameters = {
  matchId: {
    required: true,
    description: 'The ID of the match to query',
  },
}

export interface ResponseSchema {
  score: {
    event_status: string
    score_away: string
    score_home: string
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const matchId = validator.validated.data.matchId
  const url = `events/${matchId}`

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

  if (response.data.score.event_status !== 'STATUS_FINAL') {
    throw new AdapterError({
      jobRunID,
      message: 'Match status is not final',
      statusCode: 400,
    })
  }

  const result = parseInt(response.data.score.score_away) + parseInt(response.data.score.score_home)
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
