import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['height', 'difficulty']

export const endpointResultPaths = {
  height: 'height',
  difficulty: 'difficulty',
}

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export interface ResponseSchema {
  id: string
  height: number
  version: number
  timestamp: number
  tx_count: number
  size: number
  weight: number
  merkle_root: string
  previousblockhash: string
  mediantime: number
  nonce: number
  bits: number
  difficulty: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const resultPath = validator.validated.data.resultPath || ''
  const url = `/blocks`

  const options = {
    ...config.api,
    url,
    timeout: 10000,
  }

  const response = await Requester.request<ResponseSchema[]>(options)
  const result = Requester.validateResultNumber<ResponseSchema>(response.data[0], resultPath)
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
