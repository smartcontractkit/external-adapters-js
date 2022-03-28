import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { ExtendedConfig } from '../config'
import { Achievement } from '../types'
import { getEncodedCallsResult } from '../achievements'

export const supportedEndpoints = ['nba']

export interface ResponseSchema {
  player_achievements: Achievement[]
  team_achievements: Achievement[]
}

const customError = (data: Record<string, unknown>) => data.Response === 'Error'

export const description =
  'This endpoint fetches a list of achievements for NBA teams and players and returns them as an encoded value'

export const inputParameters: InputParameters = {}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, _, config) => {
  const validator = new Validator(request)
  const jobRunID = validator.validated.id
  const options = config.api
  const response = await Requester.request<ResponseSchema>(options, customError)
  const encodedCalls = await getEncodedCallsResult(
    jobRunID,
    response.data.player_achievements,
    response.data.team_achievements,
    config,
  )
  return {
    jobRunID,
    result: encodedCalls,
    statusCode: 200,
    data: {
      result: encodedCalls,
    },
  }
}
