import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory, CallbackProperty } from '@chainlink/types'
import { makeConfig } from './config'
import { rainfall, callback } from './endpoint'

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error
  Requester.logConfig(config)
  return await rainfall.execute(request, config)
}

export const CALLBACK_PROPERTIES: CallbackProperty[] = [
  {
    method: "POST",
    handler: callback.callbackHandler
  }
]

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
