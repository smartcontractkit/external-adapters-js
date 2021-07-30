import { AdapterRequest, AdapterResponse, Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { getLatestAnswer } from '@chainlink/ea-reference-data-reader'
import { Config, makeConfig } from './config'
import { getCheckImpl, getCheckProvider } from './checks'

const customParams = {
  check: true,
  source: true,
  referenceContract: ['referenceContract', 'contract'],
  multiply: true,
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const referenceContract = validator.validated.data.referenceContract
  const multiply = validator.validated.data.multiply
  const check = validator.validated.data.check
  const source = validator.validated.data.source

  const halted = await getCheckImpl(getCheckProvider(check))(input)
  if (halted) {
    const result = await getLatestAnswer(referenceContract, multiply, input.meta)
    return Requester.success(jobRunID, { data: { result }, status: 200 })
  }

  return await config.getPriceAdapter(source)(input)
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
