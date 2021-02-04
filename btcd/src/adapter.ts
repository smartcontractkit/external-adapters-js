import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT, BtcdConfig } from './config'
import { balance } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<BtcdConfig> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint) {
    case balance.NAME: {
      return balance.makeExecute(config)(request)
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Endpoint ${endpoint} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<BtcdConfig> = (config) => {
  return async (request) => execute(request, config || makeConfig())
}
