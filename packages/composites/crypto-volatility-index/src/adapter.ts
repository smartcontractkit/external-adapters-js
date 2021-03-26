import { AdapterResponse, AdapterRequest, Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { calculate } from './cryptoVolatilityIndex'
import { makeConfig, Config } from './config'

const customParams = {
  contract: ['contractAddress', 'contract'],
  multiply: false,
  heartbeatMinutes: false,
  isAdaptive: false,
  source: true,
  quote: false,
}

export const execute: Execute = async (
  config: Config,
  input: AdapterRequest,
): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id

  const result = await calculate(config, jobRunID, validator.validated.data)
  return Requester.success(jobRunID, {
    data: { result },
    status: 200,
  })
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(config || makeConfig(), request)
}
