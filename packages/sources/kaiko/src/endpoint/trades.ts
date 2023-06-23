import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { config } from '../config'
import { SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import overrides from '../config/overrides.json'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { transport } from '../transport/trades'

const inputParameters = new InputParameters({
  base: {
    aliases: ['from', 'coin'],
    required: true,
    type: 'string',
    description: 'The symbol of symbols of the currency to query',
  },
  quote: {
    aliases: ['to', 'market'],
    required: true,
    type: 'string',
    description: 'The symbol of the currency to convert to',
  },
  interval: {
    required: false,
    type: 'string',
    description:
      'The time interval to use in the query. NOTE: Changing this will likely require changing `millisecondsAgo` accordingly',
    default: '2m',
  },
  millisecondsAgo: {
    required: false,
    type: 'string',
    description:
      'Number of milliseconds from the current time that will determine start_time to use in the query',
    default: '86400000', // 24 hours
  },
  sort: {
    required: false,
    type: 'string',
    description: 'Which way to sort the data returned in the query',
    default: 'desc',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: typeof config.settings
}

export const endpoint = new CryptoPriceEndpoint({
  name: 'trades',
  aliases: ['price', 'crypto'],
  transport,
  inputParameters,
  overrides: overrides.kaiko,
})
