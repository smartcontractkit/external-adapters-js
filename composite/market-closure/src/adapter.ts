import { AdapterRequest, Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { CheckExecute, getCheck, getCheckImpl } from './checks'
import { AdapterError } from '@chainlink/external-adapter'
import { getImpl, getPriceDataProvider } from './price'

const customParams = {
  base: ['base', 'asset', 'from'],
  multiply: false,
  schedule: false,
}

export const execute: Execute = async (input) => {
  const adapterExecute = getImpl({ type: getPriceDataProvider() })
  const checkExecute = getCheckImpl({ type: getCheck() })
  return await executeWithAdapters(input, adapterExecute, checkExecute)
}

const executeWithAdapters = async (
  input: AdapterRequest,
  adapter: Execute,
  check: CheckExecute,
) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base.toUpperCase()
  const schedule = validator.validated.data.schedule || {}
  const multiply = validator.validated.data.multiply || 100000000

  const halted = await check(symbol, schedule)
  if (halted) {
    if (!input.meta || !input.meta.latestAnswer)
      throw new AdapterError({
        jobRunID,
        statusCode: 400,
        message: 'market is closed and no latestAnswer meta data',
      })

    const contractPrice = input.meta.latestAnswer
    const price = contractPrice / multiply
    return Requester.success(jobRunID, { data: { result: price } })
  }

  return await adapter(input)
}

exports.execute = execute
