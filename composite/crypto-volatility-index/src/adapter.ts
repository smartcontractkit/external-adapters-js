import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { calculate } from './cryptoVolatilityIndex'

const customParams = {
  contract: ['contractAddress', 'contract'],
  heartbeatMinutes: false,
}
export const execute: Execute = async (input) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const oracleAddress = validator.validated.data.contract
  const heartbeatMinutes = validator.validated.data.heartbeatMinutes || 180

  const result = await calculate(oracleAddress, heartbeatMinutes)
  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}

export default execute
