import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, AdapterResponse, Execute, ExecuteWithConfig } from '@chainlink/types'
import { prices } from './methods'
import { makeConfig, Config } from './config'

const customParams = {
  method: false,
}

export const execute: ExecuteWithConfig<Config> = async (
  input,
  context,
  config,
): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.jobRunID
  const method = validator.validated.data.method
  let response
  switch (method) {
    case prices.NAME:
    default:
      response = await prices.execute(input, context, config)
  }
  return Requester.success(jobRunID, response)
}

export const makeExecute = (): Execute => {
  return async (request: AdapterRequest, context) => execute(request, context, makeConfig())
}
