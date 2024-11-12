import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { httpTransport } from '../transport/historical'

const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin', 'sym', 'symbol'],
      description: 'The symbol of the currency to query',
      required: true,
      type: 'string',
    },
    convert: {
      aliases: ['quote', 'to', 'market'],
      description: 'The symbol of the currency to convert to',
      required: true,
      type: 'string',
    },
    start: {
      description: 'Timestamp (Unix or ISO 8601) to start returning quotes for',
      required: false,
      type: 'string',
    },
    end: {
      description: 'Timestamp (Unix or ISO 8601) to stop returning quotes for',
      required: false,
      type: 'string',
    },
    count: {
      description: 'The number of interval periods to return results for',
      required: false,
      type: 'number',
      default: 10,
    },
    interval: {
      description: 'Interval of time to return data points for',
      required: false,
      type: 'string',
      default: '5m',
    },
    cid: {
      description: 'The CMC coin ID (optional to use in place of base)',
      required: false,
      type: 'string',
    },
    aux: {
      description:
        'Optionally specify a comma-separated list of supplemental data fields to return',
      required: false,
      type: 'string',
    },
    skipInvalid: {
      description: '',
      required: false,
      type: 'string',
    },
  },
  [
    {
      base: 'ETH',
      convert: 'BTC',
      count: 10,
      interval: '5m',
      start: '2021-07-23T14',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: unknown
    Result: null
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'historical',
  transport: httpTransport,
  inputParameters,
  overrides: overrides.coinmarketcap,
})
