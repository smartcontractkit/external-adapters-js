import { AdapterConfigError } from '@chainlink/ea-bootstrap'
import type { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['price']

export const description =
  'The price endpoint is used to fetch a price for a base/quote asset pair. This adapter currently only supports WS connection to the API for price data.'

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The currency ticker to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market', 'term'],
    description: 'The currency ticker to convert to',
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async () => {
  throw new AdapterConfigError({
    message:
      'The Elwood Adapter does not support HTTP-only requests for prices. Ensure WS_ENABLED is "true" in the adapter configuration.',
  })
}
