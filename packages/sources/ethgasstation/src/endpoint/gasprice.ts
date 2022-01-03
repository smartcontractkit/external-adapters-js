import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['gasprice']

export const inputParameters: InputParameters = {
  speed: false,
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
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'average'
  const url = `/api/v1/egs/api/ethgasAPI.json?`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request(options)
  response.data.result = Requester.validateResultNumber(response.data, [speed]) * 1e8

  return Requester.success(jobRunID, response, config.verbose)
}
