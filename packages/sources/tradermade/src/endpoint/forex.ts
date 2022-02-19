import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { execute as liveExecute } from './live'
import { Validator } from '@chainlink/ea-bootstrap'
import overrides from '../config/symbols.json'

/**
 * This endpoint is similar to live but is supposed to only be used to fetch forex data.  This is why quote is a required parameter.
 * The reason for this split is that we want to enable WS for this endpoint but not for live.
 */

export const supportedEndpoints = ['forex']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'symbol'],
    required: true,
    description: 'The symbol of the currency to query',
  },
  quote: {
    aliases: ['to', 'market', 'convert'],
    required: true,
    description: 'The quote currency',
  },
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, inputParameters, {}, { overrides })

  const transformedInputData = {
    ...input,
    data: {
      ...input.data,
      to: validator.validated.data.quote,
    },
  }
  return await liveExecute(transformedInputData, context, config)
}
