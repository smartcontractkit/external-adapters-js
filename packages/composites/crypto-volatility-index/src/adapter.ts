import {
  AdapterResponse,
  AdapterRequest,
  ExecuteWithConfig,
  ExecuteFactory,
} from '@chainlink/types'
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

export const execute: ExecuteWithConfig<Config> = async (
  input: AdapterRequest,
  config: Config,
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

export const makeExecute: ExecuteFactory<Config> = (config?) => {
  return async (request) => execute(request, config || makeConfig())
}
