import {
  PoRBalanceEndpoint,
  PoRBalanceResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { httpTransport } from '../transport/balance'

export const inputParameters = new InputParameters({
  addresses: {
    aliases: ['result'],
    array: true,
    type: {
      address: {
        type: 'string',
        description: 'an address to get the balance of',
        required: true,
      },
      network: {
        type: 'string',
        description: 'the name of the network protocol',
        default: 'avalanche',
      },
    },
    description:
      'An array of addresses to get the balances of (as an object with string `address` as an attribute)',
    required: true,
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRBalanceResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRBalanceEndpoint({
  name: 'balance',
  transport: httpTransport,
  inputParameters,
})
