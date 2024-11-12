import { Requester, Validator, Logger } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['gasprice']

export interface ResponseSchema {
  status: number
  message: string
  result: {
    LastBlock: number
    SafeGasPrice: number
    ProposeGasPrice: number
    FastGasPrice: number
    suggestBaseFee: number
    gasUsedRatio: string
  }
}

interface Speed {
  safe: string
  medium: string
  fast: string
}

const speedType: Speed = {
  safe: 'SafeGasPrice',
  medium: 'ProposeGasPrice',
  fast: 'FastGasPrice',
}

interface ErrorSchema {
  status: '0' | '1'
  message: string
  result: string
}

const customError = (data: ResponseSchema | ErrorSchema) => data.status === '0'

export type TInputParameters = { speed: string }
export const inputParameters: InputParameters<TInputParameters> = {
  speed: {
    required: false,
    description: 'The desired speed',
    type: 'string',
    options: ['safe', 'medium', 'fast'],
    default: 'fast',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const speedValue: keyof Speed = validator.validated.data.speed as keyof Speed
  const speed = speedType[speedValue] || speedType.fast
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

  // Response schema contains the "result" key which gets overwritten by AdapterResponse's result
  // Verbose does not work as expected since the DP payload is altered
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
