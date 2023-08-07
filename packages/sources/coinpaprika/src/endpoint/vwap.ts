import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { transport } from '../transport/vwap'

export const inputParameters = new InputParameters({
  base: {
    description: 'The symbol of symbols of the currency to query',
    aliases: ['from', 'coin'],
    type: 'string',
    required: true,
  },
  hours: {
    description: 'Number of hours to get VWAP for',
    type: 'number',
    default: 24,
  },
  coinid: {
    description: 'The coin ID (optional to use in place of `base`)',
    type: 'string',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: SingleNumberResultResponse
}

export const endpoint = new AdapterEndpoint({
  name: 'vwap',
  aliases: ['crypto-vwap'],
  transport,
  inputParameters,
  overrides: overrides.coinpaprika,
})
