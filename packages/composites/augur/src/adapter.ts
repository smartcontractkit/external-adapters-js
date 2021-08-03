import { AdapterError, Logger, Validator } from '@chainlink/ea-bootstrap'
import { AdapterRequest, ExecuteWithConfig, Execute } from '@chainlink/types'
import { resolveMarkets, createMarkets, pokeMarkets } from './methods'
import { Config, makeConfig } from './config'

const customParams = {
  method: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.jobRunID
  const method = validator.validated.data.method

  Logger.debug(`Augur: Choosing method ${method}`)
  switch (method.toLowerCase()) {
    case 'resolve':
      Logger.debug(`Augur: Chose method resolve`)
      return resolveMarkets.execute(input, context, config)
    case 'create':
      Logger.debug(`Augur: Chose method create`)
      return createMarkets.execute(input, context, config)
    case 'poke':
      Logger.debug(`Augur: Chose method poke`)
      return pokeMarkets.execute(input, context, config)
    default:
      throw new AdapterError({
        jobRunID,
        message: `Method ${method} not supported.`,
        statusCode: 400,
      })
  }
}

export const makeExecute = (): Execute => {
  return async (request: AdapterRequest, context) => execute(request, context, makeConfig())
}
