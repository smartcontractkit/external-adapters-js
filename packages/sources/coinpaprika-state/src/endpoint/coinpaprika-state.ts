import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { CoinpaprikaSubscriptionTransport } from '../transport/coinpaprika-state'

export const inputParameters = new InputParameters(
  {
    base: {
      aliases: ['from', 'coin'],
      required: true,
      type: 'string',
      description: 'The symbol of the currency to query',
    },
    quote: {
      aliases: ['to', 'market'],
      required: true,
      type: 'string',
      description: 'The symbol of the currency to convert to',
    },
  },
  [
    {
      base: 'LUSD',
      quote: 'USD',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: number
    Data: {
      result: number
      timestamp: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'coinpaprika-state',
  aliases: ['state'],
  transport: CoinpaprikaSubscriptionTransport,
  inputParameters,
  overrides: overrides['coinpaprika-state'],
})
