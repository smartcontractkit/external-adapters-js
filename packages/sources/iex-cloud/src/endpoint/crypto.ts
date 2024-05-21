import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { config } from '../config'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { transport } from '../transport/crypto'

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'asset', 'symbol'],
      description: 'The symbol of symbols of the currency to query',
      required: true,
      type: 'string',
    },
    quote: {
      aliases: ['to', 'market'],
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

export const endpoint = new CryptoPriceEndpoint({
  name: 'crypto',
  transport,
  inputParameters: inputParameters,
})
