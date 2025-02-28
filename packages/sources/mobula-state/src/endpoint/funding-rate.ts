import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'

import { config } from '../config'
import { wsTransport } from '../transport/funding-rate'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'symbol', 'market'],
      required: true,
      type: 'string',
      description: 'The symbol of symbols of the currency to query',
    },
    quote: {
      aliases: ['to', 'convert'],
      required: true,
      type: 'string',
      description: 'The symbol of the currency to convert to',
    },
    exchange: {
      required: true,
      type: 'string',
      description: 'Which exchange to return the funding rate for',
    },
  },
  [
    {
      base: 'BTC',
      quote: 'USDC',
      exchange: 'binance',
    },
  ],
)

export type Response = {
  Result: null
  Data: {
    fundingRate: number
    fundingTime: number
    epochDurationMs: number
  }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: Response
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'funding-rate',
  transport: wsTransport,
  inputParameters,
})
