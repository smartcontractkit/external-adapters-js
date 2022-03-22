import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { calculate } from '../utils/cryptoVolatilityIndex'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['volatility']

const inputParameters: InputParameters = {
  contract: {
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

  const result = await calculate(validator.validated, request.data, context)
  const response = { data: { result }, status: 200 }
  return Requester.success(jobRunID, response)
}
