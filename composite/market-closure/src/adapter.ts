import { AdapterRequest, Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { getLatestAnswer } from '@chainlink/reference-data-reader'
import { Config, makeConfig } from './config'

const customParams = {
  referenceContract: ['referenceContract', 'contract'],
  multiply: true,
}

export const execute = async (input: AdapterRequest, config: Config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const referenceContract = validator.validated.data.referenceContract
  const multiply = validator.validated.data.multiply

  const halted = await config.checkAdapter(input)
  if (halted) {
    const result = await getLatestAnswer(referenceContract, multiply, input.meta)
    return Requester.success(jobRunID, { data: { result }, result, status: 200 })
  }

  return await config.priceAdapter(input)
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
