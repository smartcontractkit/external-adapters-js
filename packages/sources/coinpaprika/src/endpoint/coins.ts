import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['coins']

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

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
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = '/v1/coins'
  const options = {
    ...config.api,
    url,
  }
  const response = await Requester.request<CoinsResponse[]>(options)
  return Requester.success(jobRunID, response, true)
}
