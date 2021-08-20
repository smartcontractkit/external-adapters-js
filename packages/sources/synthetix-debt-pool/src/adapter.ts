import { AdapterResponse, AdapterContext, Execute, AdapterRequest } from '@chainlink/types'
import { makeConfig, Config as AdapterConfig } from './config'
import * as endpoints from './endpoint'
import { Requester, Validator } from '@chainlink/ea-bootstrap'

export const execute = async (
  request: AdapterRequest,
  context: AdapterContext,
  config: AdapterConfig,
): Promise<AdapterResponse> => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error
  Requester.logConfig(config)
  return await endpoints.debt.execute(request, context, config)
}

export const makeExecute = (config?: AdapterConfig): Execute => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
