import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

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

export const inputParameters: InputParameters = {
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

  const response = await HTTP.request<ResponseSchema>(options, customError)
  const result = HTTP.validateResultNumber(response.data, ['estimates', speed])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
