import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['gasprice']

export type TInputParameters = { speed: string }
export const inputParameters: InputParameters<TInputParameters> = {
  speed: {
    required: false,
    description: 'The desired speed',
    type: 'string',
    options: ['safeLow', 'average', 'fast', 'fastest'],
    default: 'average',
  },
}

export interface ResponseSchema {
  fast: number
  fastest: number
  safeLow: number
  average: number
  block_time: number
  blockNum: number
  speed: number
  safeLowWait: number
  avgWait: number
  fastWait: number
  fastestWait: number
  gasPriceRange: Record<string, number>
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed
  const url = `/api/ethgasAPI.json`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, [speed]) * 1e8

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
