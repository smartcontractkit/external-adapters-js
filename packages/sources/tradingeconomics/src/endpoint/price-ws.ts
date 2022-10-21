import { AdapterConfigError, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Config } from '../config'

export const supportedEndpoints = ['price-ws']

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'asset'],
    required: true,
    description: 'The symbol of the asset to query',
    type: 'string',
  },
  quote: {
    aliases: ['to', 'term'],
    description: 'The quote symbol of the asset to query',
    type: 'string',
    default: 'USD',
  },
}
export const execute: ExecuteWithConfig<Config> = async (request) => {
  new Validator(request, inputParameters)
  throw new AdapterConfigError({
    message:
      'The default configuration for the TradingEconomics adapter does not support making HTTP requests. Make sure WS is enabled in the adapter configuration. To use HTTP requests switch to using "endpoint: price"',
  })
}
