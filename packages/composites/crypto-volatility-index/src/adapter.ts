import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, Execute } from '@chainlink/types'
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
}

export const execute: Execute = async (input: AdapterRequest) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const result = await calculate(validator.validated, input.data)
  const response = { data: { result }, status: 200 }
  return Requester.success(jobRunID, response)
}

export default execute
