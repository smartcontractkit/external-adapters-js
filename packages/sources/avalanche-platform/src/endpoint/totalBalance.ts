import {
  PoRBalanceEndpoint,
  PoRBalanceResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { totalBalanceTransport } from '../transport/totalBalance'

export const inputParameters = new InputParameters(
  {
    addresses: {
      aliases: ['result'],
      array: true,
      type: {
        address: {
          type: 'string',
          description: 'an address to get the balance of',
          required: true,
        },
      },
      description:
        'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
      required: true,
    },
    assetId: {
      type: 'string',
      description: 'The ID of the asset to get the balance for',
      default: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z', // AVAX asset ID
    },
  },
  [
    {
      addresses: [
        {
          address: 'P-avax1tnuesf6cqwnjw7fxjyk7lhch0vhf0v95wj5jvy',
        },
      ],
      assetId: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRBalanceResponse & {
    Data: {
      decimals: number
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new PoRBalanceEndpoint({
  name: 'totalBalance',
  aliases: [],
  transport: totalBalanceTransport,
  inputParameters,
})
