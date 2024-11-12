import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['gasprice']

export interface ResponseSchema {
  safeLow: number
  standard: number
  fast: number
  fastest: number
  blockNum: number
}

export type TInputParameters = { speed: string }
export const inputParameters: InputParameters<TInputParameters> = {
  speed: {
    required: false,
    description: 'The desired speed',
    default: 'fast',
    options: ['safeLow', 'standard', 'fast', 'fastest'],
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'fast'

  const options = {
    ...config.api,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, [speed])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
