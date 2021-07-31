import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { makeConfig } from './config'

const customParams = {
  speed: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)
  const jobRunID = validator.validated.id
  const speed = validator.validated.data.speed || 'standard'
  const reqConfig = {
    ...config.api,
  }
  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, [speed]) * 1e9
  return Requester.success(jobRunID, response, config.verbose)
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
