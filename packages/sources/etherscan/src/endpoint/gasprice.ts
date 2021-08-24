import { Requester, Validator, Logger } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['gasprice']

export interface ResponseSchema {
  status: number
  message: string
  result: {
    LastBlock: number
    SafeGasPrice: number
    ProposeGasPrice: number
    FastGasPrice: number
  }
}

const speedType: any = {
  safe: 'SafeGasPrice',
  medium: 'ProposeGasPrice',
  fast: 'FastGasPrice',
}

const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  speed: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const speedValue = validator.validated.data.speed
  const speed = speedType[speedValue] || speedType['fast']
  const url = `/api`

  const params = {
    module: 'gastracker',
    action: 'gasoracle',
    apikey: config.apiKey,
  }

  const options = {
    ...config.api,
    params,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  if (!config.apiKey) {
    Logger.warn(response.data.message)
  }
  const result = Requester.validateResultNumber(response.data, ['result', speed])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
