import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'

export const supportedEndpoints = ['coins']

export interface CoinsResponse {
  id: string
  symbol: string
  name: string
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = '/coins/list'
  const options = {
    ...config.api,
    url,
    params: {
      x_cg_pro_api_key: config.apiKey,
    },
  }
  const response = await Requester.request<CoinsResponse[]>(options)
  return Requester.success(jobRunID, response, true)
}
