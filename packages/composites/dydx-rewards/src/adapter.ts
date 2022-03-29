import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteFactory, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { DEFAULT_METHOD, makeConfig, Config } from './config'
import { poke } from './method'

const inputParameters: InputParameters = {
  method: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const method = validator.validated.data.method || DEFAULT_METHOD

  switch (method.toLowerCase()) {
    case poke.NAME: {
      return await poke.execute(request, context, config)
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
  return async (request, context) => execute(request, context, config || makeConfig())
}
