import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['total-score']

export const inputParameters: InputParameters = {
  matchId: true,
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

  const response = await Requester.request(reqConfig)

  if (response.data.score.event_status !== 'STATUS_FINAL') {
    throw new AdapterError({
      jobRunID,
      message: 'Match status is not final',
      statusCode: 400,
    })
  }

  response.data.result =
    parseInt(response.data.score.score_away) + parseInt(response.data.score.score_home)
  return Requester.success(jobRunID, response, config.verbose)
}
