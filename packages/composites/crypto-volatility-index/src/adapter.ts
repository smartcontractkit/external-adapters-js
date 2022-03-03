import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterContext, AdapterRequest, Execute } from '@chainlink/ea-bootstrap'
import { calculate } from './cryptoVolatilityIndex'

const customParams = {
  contract: ['contractAddress', 'contract'],
  multiply: false,
  heartbeatMinutes: false,
  isAdaptive: false,
  cryptoCurrencies: false,
  deviationThreshold: false,
  lambdaMin: false,
  lambdaK: false,
  network: false,
}

export const execute: Execute = async (input: AdapterRequest, context: AdapterContext) => {
  const validator = new Validator(input, customParams)

  const jobRunID = validator.validated.id

  const result = await calculate(validator.validated, input.data, context)
  const response = { data: { result }, status: 200 }
  return Requester.success(jobRunID, response)
}

export default execute
