import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, AdapterResponse } from '@chainlink/types'
import { Config, getConfig } from './src/config'
import { calculate } from './src/cryptoVolatilityIndex'

export const execute = async (
  request: AdapterRequest,
  config: Config,
): Promise<AdapterResponse> => {

  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  
  const result = await calculate();
  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
export const executeWithDefaults = async (request: AdapterRequest): Promise<AdapterResponse> =>
  execute(request, getConfig())
