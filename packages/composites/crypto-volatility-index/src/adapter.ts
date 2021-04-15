import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { calculate } from './cryptoVolatilityIndex'

const customParams = {
  contract: ['contractAddress', 'contract'],
  multiply: false,
  heartbeatMinutes: false,
  isAdaptive: false,
}

export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const result = await calculate(validator.validated, input.data)
  return Requester.success(jobRunID, {
    data: { result },
    status: 200,
  })
}

export default execute
