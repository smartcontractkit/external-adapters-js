import { HTTP, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['gasprice']

const customError = (data: ResponseSchema) => {
  return Object.keys(data.payload).length < 1
}

export const inputParameters: InputParameters = {
  speed: {
    required: false,
    description: 'The desired speed',
    type: 'string',
    options: ['safeLow', 'average', 'fast', 'fastest'],
    default: 'average',
  },
  blockchain: {
    required: false,
    description: 'The blockchain id to get gas prices from',
    type: 'string',
    default: 'ethereum-mainnet',
  },
}

export interface ResponseSchema {
  status: number
  title: string
  description: string
  payload: {
    average: GasInfo
    fast: GasInfo
    fastest: GasInfo
    safeLow: GasInfo
  }
}
export interface GasInfo {
  gasPrice: number
  numBlocks: number
  wait: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'average'
  const blockchain = validator.validated.data.blockchain || 'ethereum-mainnet'
  const url = '/api/v2/transactions/gas/predictions'

  const options = {
    ...config.api,
    url,
    headers: {
      ...config.api.headers,
      'x-amberdata-blockchain-id': blockchain,
    },
  }

  const response = await HTTP.request<ResponseSchema>(options, customError)
  const result = HTTP.validateResultNumber(response.data, ['payload', speed, 'gasPrice'])

  return HTTP.success(jobRunID, HTTP.withResult(response, result), config.verbose)
}
