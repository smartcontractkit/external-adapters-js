import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory, Config } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT } from './config'
import { price } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint) {
    default: {
      return await price.execute(request, context, config)
    }
  }
}

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
