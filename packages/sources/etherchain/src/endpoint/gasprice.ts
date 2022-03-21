import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['gasprice']

export type TInputParameters = { speed: string }
export const inputParameters: InputParameters<TInputParameters> = {
  speed: {
    required: false,
    type: 'string',
    description: 'The desired speed',
    options: ['safeLow', 'standard', 'fast', 'fastest'],
    default: 'standard',
  },
}

interface ResponseSchema {
  safeLow: string
  standard: string
  fast: string
  fastest: string
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator<TInputParameters>(request, inputParameters)

  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed
  const url = `/api/gasPriceOracle`

  const options = {
    ...config.api,
    url,
  }

  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, [speed]) * 1e9

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
