import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { exchangeRateTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    base: {
      required: true,
      type: 'string',
      description: 'The symbol of symbols of the currency to query',
      options: ['sUSDe', 'wstETH'],
    },
    quote: {
      required: true,
      type: 'string',
      description: 'The symbol of the currency to convert to',
      options: ['USD'],
    },
    base_address: {
      required: true,
      type: 'string',
      description: 'The address of contract that convert base into an intermidate currency',
    },
    quote_address: {
      required: true,
      type: 'string',
      description: 'The address of contract that convert intermidate currency into quote',
    },
  },
  [
    {
      base: 'sUSDe',
      quote: 'USD',
      base_address: '0x0000000000000000000000000000000000000000',
      quote_address: '0x0000000000000000000000000000000000000000',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: [],
  transport: exchangeRateTransport,
  inputParameters,
})
