import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
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
  const oracleAddress = validator.validated.data.contract
  const multiply = validator.validated.data.multiply || 1000000
  const heartbeatMinutes = validator.validated.data.heartbeatMinutes || 60
  const isAdaptive = validator.validated.data.isAdaptive as boolean

  const result = await calculate(oracleAddress, multiply, heartbeatMinutes, isAdaptive)
  return Requester.success(jobRunID, {
    data: { result },
    status: 200,
  })
}

export default execute
