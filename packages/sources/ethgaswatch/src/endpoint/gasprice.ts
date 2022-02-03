import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['gasprice']

export const inputParameters: InputParameters = {
  speed: {
    required: false,
    description: 'The desired speed',
    type: 'string',
    options: ['slow', 'normal', 'fast', 'instant'],
    default: 'fast',
  },
}

export interface ResponseSchema {
  slow: { gwei: number; usd: number }
  normal: { gwei: number; usd: number }
  fast: { gwei: number; usd: number }
  instant: { gwei: number; usd: number }
  ethPrice: number
  lastUpdated: number
  sources: {
    name: string
    source: string
    fast: number
    standard: number
    slow: number
    lastBlock: number
  }[]
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed
  const url = `/api/gas`

  const options = {
    ...config.api,
    url,
  }

  const response = await HTTP.request<ResponseSchema>(options)
  const result = HTTP.validateResultNumber(response.data, [speed, 'gwei'])
  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
