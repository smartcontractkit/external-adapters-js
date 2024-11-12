import { config } from '../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
export const globalInputParameters = new InputParameters(
  {
    market: {
      aliases: ['quote', 'to'],
      description: 'The symbol of the currency to query',
      required: true,
      type: 'string',
    },
  },
  [
    {
      market: 'BTC',
    },
  ],
)

export type BaseGlobalEndpointTypes = {
  Parameters: typeof globalInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}
