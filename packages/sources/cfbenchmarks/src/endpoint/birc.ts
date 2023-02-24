import { InputParameters, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig } from '@chainlink/ea-bootstrap'
import { Config } from '../config'

export const supportedEndpoints = ['birc']

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export interface ResponseSchema {
  serverTime: string
  error: string
  payload: {
    tenors: {
      SIRB: string
      '1W': string
      '2W': string
      '3W': string
      '1M': string
      '2M': string
      '3M': string
      '4M': string
      '5M': string
    }
    time: number
    amendTime: number
    repeatOfPreviousValue: boolean
  }[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id

  const reqConfig = { ...config.api, params: { id: 'BIRC' }, url: `/v1/curves` }
  const response = await Requester.request<ResponseSchema>(reqConfig)

  const result = Requester.validateResultNumber(response.data.payload, [
    response.data.payload.length - 1,
    'tenors',
    'SIRB',
  ])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
