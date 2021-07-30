import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['coins']

export const inputParameters: InputParameters = {}

export interface CoinsResponse {
  id: string
  name: string
  symbol: string
  rank: number
  is_new: boolean
  is_active: boolean
  type: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = '/v1/coins'
  const options = {
    ...config.api,
    url,
  }
  const response = await Requester.request<CoinsResponse[]>(options)
  return Requester.success(jobRunID, response, true)
}
