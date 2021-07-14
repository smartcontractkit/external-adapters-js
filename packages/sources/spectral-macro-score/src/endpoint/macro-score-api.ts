import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { NAME as AdapterName } from '../config'

export const NAME = 'spectral-proxy' // This should be filled in with a lowercase name corresponding to the API endpoint

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
  data: RequestResponseResult
  status: number
}

export interface IRequestInput {
  id: string // numeric
  data: {
    tokenIdInt: string // numeric
    tickSet: string // numeric
  }
}

export const execute: ExecuteWithConfig<Config> = async (request: IRequestInput, config) => {
  const validator = new Validator(request, {
    tokenIdInt: 'tokenIdInt',
    tickSet: 'tickSet',
  })
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = `https://xzff24vr3m.execute-api.us-east-2.amazonaws.com/default/spectral-proxy/`

  const params = {
    // api_key: config.apiKey,
    api_key: 'XYpX4gaNaCafgAzdBpQyaLrF34N0Qp71N6qOwvSh',
  }

  const options = {
    ...config.api,
    params,
    url,
    method: 'POST',
    data: `{"tokenInt":"${validator.validated.data.tokenIdInt}"}`,
  }
  const response = await (<ScoreRequestResponse>Requester.request(options, customError))
  response.data.result = Requester.validateResultNumber(response.data, ['score'])

  return Requester.success(jobRunID, response, config.verbose)
}
