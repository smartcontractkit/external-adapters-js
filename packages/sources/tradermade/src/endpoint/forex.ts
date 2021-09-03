import { ExecuteWithConfig, Config } from '@chainlink/types'
import { execute as liveExecute } from './live'
import { Validator } from '@chainlink/ea-bootstrap'

/**
 * This endpoint is similar to live but is supposed to only be used to fetch forex data.  This is why quote is a required parameter.
 * The reason for this split is that we want to enable WS for this endpoint but not for live.
 */

export const supportedEndpoints = ['forex']

export const customParams = {
  base: ['base', 'from', 'symbol', 'market'],
  quote: ['quote', 'to', 'market', 'convert'],
}

export const execute: ExecuteWithConfig<Config> = async (input, context, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  const transformedInputData = {
    ...input,
    data: {
      ...input.data,
      to: validator.validated.data.quote,
    },
  }
  return await liveExecute(transformedInputData, context, config)
}
