import { Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, ExecuteFactory } from '@chainlink/types'
import { DEFAULT_METHOD, makeConfig } from './config'
import { read, write } from './method'

const inputParams = {
  method: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const method = validator.validated.data.method || DEFAULT_METHOD

  switch (method.toLowerCase()) {
    case read.NAME: {
      return await read.execute(request, config)
    }
    case write.NAME: {
      return await write.execute(request, config)
    }
    default: {
      throw new AdapterError({
        jobRunID,
        message: `Method ${method} not supported.`,
        statusCode: 400,
      })
    }
  }
}

export const makeExecute: ExecuteFactory<Config> = (config?: Config) => {
  return async (request) => execute(request, config || makeConfig())
}
