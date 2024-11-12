import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/vwap'

export const inputParams = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'fsym'],
      description: 'The symbol of symbols of the currency to query',
      type: 'string',
      required: true,
    },
    quote: {
      aliases: ['to', 'market', 'tsym'],
      description: 'The symbol of the currency to convert to',
      type: 'string',
      required: true,
    },
    hours: {
      description: 'Number of hours to get VWAP for',
      type: 'number',
      default: 24,
    },
  },
  [
    {
      base: 'AMPL',
      quote: 'USD',
      hours: 24,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParams.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new PriceEndpoint({
  name: 'vwap',
  aliases: ['crypto-vwap'],
  transport: httpTransport,
  inputParameters: inputParams,
  overrides: overrides.cryptocompare,
})
