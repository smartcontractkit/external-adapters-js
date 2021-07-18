import { Requester } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'

export const MacroScoreAPIName = 'spectral-proxy' // This should be filled in with a lowercase name corresponding to the API endpoint

export interface ICustomError {
  Response: string
}

const customError = (data: ICustomError) => {
  if (data.Response === 'Error') return true
  return false
}

export interface RequestResponseResult {
  address: string
  score_aave: string // numeric
  score_comp: string // numeric
  score: string // numeric
  updated_at: string // ISO UTC string
  is_updating_aave: boolean
  is_updating_comp: boolean
  result: number
}

export interface ScoreRequestResponse {
  data: RequestResponseResult[]
  status: number
}

export interface IRequestInput {
  id: string // numeric
  data: {
    tokenIdInt: string // numeric
    tickSet: string // numeric
    jobRunID: string // numeric
  }
}

export const execute: ExecuteWithConfig<Config> = async (request: IRequestInput, config) => {
  const options = {
    url: config.api,
    method: 'POST',
    data: `{"tokenInt":"${request.data.tokenIdInt}"}`,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey ?? '',
    },
    timeout: 30000,
  }
  const response = <ScoreRequestResponse>await Requester.request(options, customError)
  response.data[0].result = Requester.validateResultNumber(response.data[0], ['score'])
  return Requester.success(request.data.jobRunID, response, config.verbose)
}
