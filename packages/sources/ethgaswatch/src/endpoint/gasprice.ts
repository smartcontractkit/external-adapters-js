import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['gasprice']

export type TInputParameters = { speed: string }
export const inputParameters: InputParameters<TInputParameters> = {
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

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, [speed, 'gwei'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
