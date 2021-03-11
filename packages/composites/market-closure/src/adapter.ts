import { AdapterRequest, AdapterResponse, Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Check, getCheckImpl, getCheckProvider } from './checks'
import { getImpl, getPriceDataProvider } from './price'
import { getLatestAnswer } from '@chainlink/reference-data-reader'

const customParams = {
  referenceContract: ['referenceContract', 'contract'],
  multiply: true,
}

export const execute: Execute = async (input) => {
  const adapterExecute = getImpl(getPriceDataProvider())
  const checkExecute = getCheckImpl(getCheckProvider(), input)
  return await executeWithAdapters(input, adapterExecute, checkExecute)
}

export const executeWithAdapters = async (
  input: AdapterRequest,
  adapter: Execute,
  check: Check,
): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const referenceContract = validator.validated.data.referenceContract
  const multiply = validator.validated.data.multiply

  const halted = await check()
  if (halted) {
    const result = await getLatestAnswer(referenceContract, multiply, input.meta)
    return Requester.success(jobRunID, { data: { result }, status: 200 })
  }

  return await adapter(input)
}

exports.execute = execute
