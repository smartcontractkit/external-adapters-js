import { AdapterInputError, ExecuteFactory, Logger, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { resolveMarkets, createMarkets, pokeMarkets } from './methods'
import { Config, makeConfig } from './config'

export type TInputParameters = {
  method: string
}

const inputParameters: InputParameters<TInputParameters> = {
  method: true,
}

export const execute: ExecuteWithConfig<Config, TInputParameters> = async (
  input,
  context,
  config,
) => {
  const validator = new Validator(input, inputParameters)

  const jobRunID = validator.validated.id
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
      throw new AdapterInputError({
        jobRunID,
        message: `Method ${method} not supported.`,
        statusCode: 400,
      })
  }
}

export const makeExecute: ExecuteFactory<Config, TInputParameters> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
