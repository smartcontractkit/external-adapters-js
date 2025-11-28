import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { wsTransport } from '../transport/price'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'symbol'],
      required: true,
      type: 'string',
      description: 'The symbol of symbols of the currency to query',
    },
    quote: {
      // 'market' must be included in quote aliases for CryptoPriceEndpoint compatibility.
      aliases: ['to', 'market'],
      required: true,
      type: 'string',
      description: 'The symbol of the currency to convert to',
    },
  },
  [
    {
      base: 'EZETH',
      quote: 'USD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new CryptoPriceEndpoint({
  name: 'price',
  aliases: ['state', 'crypto'],
  transport: wsTransport,
  inputParameters,
})
