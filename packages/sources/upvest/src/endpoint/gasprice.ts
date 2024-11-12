import { Requester, Validator } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const description = 'Get the current gas price on Ethereum'

export const supportedEndpoints = ['gasprice']

export interface ResponseSchema {
  success: boolean
  updated: string
  estimates: {
    fastest: number
    fast: number
    medium: number
    slow: number
  }
}

const customError = (data: ResponseSchema) => !data.success

export type TInputParameters = { speed: string }
export const inputParameters: InputParameters<TInputParameters> = {
  speed: {
    required: false,
    description: 'The desired speed',
    options: ['slow', 'medium', 'fast', 'fastest'],
    default: 'fast',
    type: 'string',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed
  const url = '/estimate_eth_fees'

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['estimates', speed])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
