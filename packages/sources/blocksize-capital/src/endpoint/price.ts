import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['price']

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The currency ticker to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The currency ticker to convert to',
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async () => {
  throw Error(
    'The Blocksize Capital Adapter does not support HTTP requests. Ensure WS_ENABLED is "true" in the adapter configuration.',
  )
}
