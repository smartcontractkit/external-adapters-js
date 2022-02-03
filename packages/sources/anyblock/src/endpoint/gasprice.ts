import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['gasprice']

const customError = (data: ResponseSchema) => {
  if (Object.keys(data).length < 1) return true
  return !('health' in data) || !data.health
}

export const inputParameters: InputParameters = {
  speed: {
    description: 'The desired speed',
    type: 'string',
    default: 'standard',
    options: ['slow', 'standard', 'fast', 'instant'],
  },
}

export interface ResponseSchema {
  health: boolean
  blockNumber: number
  blockTime: number
  slow: number
  standard: number
  fast: number
  instant: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'standard'
  const url = `/latest-minimum-gasprice`

  const options = {
    ...config.api,
    url,
  }

  const response = await HTTP.request<ResponseSchema>(options, customError)
  const result = HTTP.validateResultNumber(response.data, [speed]) * 1e9

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
