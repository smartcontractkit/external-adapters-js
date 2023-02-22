import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['gasprice']

const customError = (data: ResponseSchema) => {
  if (Object.keys(data).length < 1) return true
  return !('block_number' in data) || !data.block_number
}

export type TInputParameters = { speed: string }

export const inputParameters: InputParameters<TInputParameters> = {
  speed: {
    description: 'The desired speed',
    type: 'string',
    default: 'standard',
    options: ['slow', 'standard', 'fast', 'instant'],
  },
}

export interface ResponseSchema {
  block_number: number
  slow: number
  standard: number
  fast: number
  instant: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'standard'
  const url = `/universal/v1/ethereum/mainnet/tx/gasprice`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, [speed])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
