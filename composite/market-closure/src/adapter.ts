import { AdapterRequest, AdapterResponse, Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { CheckExecute, getCheck, getCheckImpl } from './checks'
import { getImpl, getPriceDataProvider } from './price'
import { getLatestAnswer } from '@chainlink/reference-data-reader'

const customParams = {
  base: ['base', 'asset', 'from'],
  referenceContract: ['referenceContract', 'contract'],
  multiply: true,
  schedule: false,
}

export const execute: Execute = async (input) => {
  const adapterExecute = getImpl({ type: getPriceDataProvider() })
  const checkExecute = getCheckImpl({ type: getCheck() })
  return await executeWithAdapters(input, adapterExecute, checkExecute)
}

export const executeWithAdapters = async (
  input: AdapterRequest,
  adapter: Execute,
  check: CheckExecute,
): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base.toUpperCase()
  const schedule = validator.validated.data.schedule || {}
  const referenceContract = validator.validated.data.referenceContract
  const multiply = validator.validated.data.multiply

  const halted = await check(symbol, schedule)
  if (halted) {
    const result = await getLatestAnswer(referenceContract, multiply, input.meta)
    return Requester.success(jobRunID, { data: { result }, result, status: 200 })
  }

  return await adapter(input)
}

exports.execute = execute
