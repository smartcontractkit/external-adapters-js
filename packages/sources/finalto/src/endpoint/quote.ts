import {
  PriceEndpoint,
  priceEndpointInputParametersDefinition,
} from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { wsTransport } from '../transport/quote'

export const inputParameters = new InputParameters(
  {
    ...priceEndpointInputParametersDefinition,
  },
  [
    {
      base: 'GBP',
      quote: 'USD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new PriceEndpoint({
  name: 'quote',
  aliases: ['forex', 'fx', 'commodities', 'stock'],
  transport: wsTransport,
  inputParameters,
})
