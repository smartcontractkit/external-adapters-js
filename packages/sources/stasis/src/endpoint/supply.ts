import { ExecuteWithConfig, Config, InputParameters, AxiosResponse } from '@chainlink/ea-bootstrap'
import { Requester, Validator } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['supply']

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export interface ResponseSchema {
  accounts: {
    nexpay: { amount: string }
    xnt: { amount: string }
    ext: { amount: string }
  }
  summary: { amount: string }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const url = '/transparency/eurs-statement'

  const options = {
    ...config.api,
    url,
  }

  const response: AxiosResponse = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, ['summary', 'amount'])
  return Requester.success(jobRunID, Requester.withResult(response, result))
}
