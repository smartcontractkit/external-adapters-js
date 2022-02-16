import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import includes from './../config/includes.json'

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
  const validator = new Validator(request, inputParameters, {}, { includes })

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

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, ['payload', speed, 'gasPrice'])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
