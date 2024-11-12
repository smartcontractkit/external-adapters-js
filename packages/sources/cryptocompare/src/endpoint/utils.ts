import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
export const cryptoInputParams = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'fsym'],
      description: 'The symbol of symbols of the currency to query',
      required: true,
      type: 'string',
    },
    quote: {
      aliases: ['to', 'market', 'tsym'],
      description: 'The symbol of the currency to convert to',
      required: true,
      type: 'string',
    },
  },
  [
    {
      base: 'ETH',
      quote: 'USD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof cryptoInputParams.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}
