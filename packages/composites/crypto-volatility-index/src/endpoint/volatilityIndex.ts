import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { calculate } from '../utils/cryptoVolatilityIndex'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['volatilityIndex']

export type TInputParameters = {
  contract: string
  multiply?: number
  heartbeatMinutes?: number
  isAdaptive?: boolean
  cryptoCurrencies?: string[]
  deviationThreshold?: number
  lambdaMin?: number
  lambdaK?: number
  network?: string
}

const inputParameters: InputParameters<TInputParameters> = {
  contract: {
    required: true,
    aliases: ['contractAddress'],
  },
  multiply: {
    required: false,
  },
  heartbeatMinutes: {
    required: false,
  },
  isAdaptive: {
    required: false,
  },
  cryptoCurrencies: {
    required: false,
  },
  deviationThreshold: {
    required: false,
  },
  lambdaMin: {
    required: false,
  },
  lambdaK: {
    required: false,
  },
  network: {
    required: false,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, context) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id

  const result = await calculate(
    { data: validator.validated.data, id: jobRunID },
    request.data,
    context,
  )
  const response = { data: { result }, status: 200 }
  return Requester.success(jobRunID, response)
}
