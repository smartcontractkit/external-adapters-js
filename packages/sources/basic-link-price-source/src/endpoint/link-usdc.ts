import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { linkUsdcTransport } from '../transport/link-usdc'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin'],
      type: 'string',
      description: 'The symbol of symbols of the currency to query',
      default: 'LINK',
      required: false,
    },
    quote: {
      aliases: ['to', 'market'],
      type: 'string',
      description: 'The symbol of the currency to convert to',
      default: 'USDC',
      required: false,
    },
    chain: {
      type: 'string',
      description: 'Blockchain to query',
      required: false,
      default: 'ethereum',
      options: ['ethereum', 'arbitrum'],
    },
  },
  [
    {
      base: 'LINK',
      quote: 'USDC',
      chain: 'ethereum',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new PriceEndpoint({
  name: 'link-usdc',
  transport: linkUsdcTransport,
  inputParameters,
})
