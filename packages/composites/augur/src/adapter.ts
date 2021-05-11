import { AdapterError, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, ExecuteWithConfig, Execute } from '@chainlink/types'
import { resolveMarkets, createMarkets } from './methods'
import { Config, makeConfig } from './config'

const customParams = {
  method: true
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const method = validator.validated.data.method

  switch (method.toLowerCase()) {
    case 'resolve':
      return resolveMarkets.execute(input, config)
    case 'create':
      return createMarkets.execute(input, config)
    default:
      throw new AdapterError({
        jobRunID,
        message: `Method ${method} not supported.`,
        statusCode: 400,
      })
  }
}

export const makeExecute = (): Execute => {
  return async (request: AdapterRequest) => execute(request, makeConfig())
}
