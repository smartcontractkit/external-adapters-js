import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { makeConfig, DEFAULT_ENDPOINT, Config } from './config'
import { txsend } from './endpoint'

const inputParams = {
  endpoint: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  Requester.logConfig(config)

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT

  switch (endpoint) {
    case txsend.NAME: {
      return await txsend.execute(request, context, config)
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

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
