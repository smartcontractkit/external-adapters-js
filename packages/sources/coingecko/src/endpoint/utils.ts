import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'

export const cryptoInputParams = new InputParameters({
  coinid: {
    description: 'The Coingecko id to query',
    type: 'string',
  },
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
    required: false,
  },
  quote: {
    aliases: ['to', 'market'],
    type: 'string',
    description: 'The symbol of the currency to convert to',
    required: true,
  },
})

export type BaseCryptoEndpointTypes = {
  Parameters: typeof cryptoInputParams.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const globalInputParameters = new InputParameters({
  market: {
    type: 'string',
    aliases: ['to', 'quote'],
    description: 'The ticker of the coin to query',
    required: true,
  },
})

export type BaseGlobalEndpointTypes = {
  Parameters: typeof globalInputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}
