import { Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['forex']

export type TInputParameters = { base: string; quote: string }
export const inputParameters: InputParameters<TInputParameters> = {
  base: {
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    required: true,
  },
  quote: {
    aliases: ['to', 'market'],
    description: 'The symbol of the currency to convert to',
    required: true,
  },
}

export const execute: ExecuteWithConfig<Config> = async (request) => {
  new Validator<TInputParameters>(request, inputParameters)
  throw Error(
    'The NCFX adapter does not support making HTTP requests. Make sure WS is enabled in the adapter configuration.',
  )
}
