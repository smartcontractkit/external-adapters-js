import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'
import { config } from '../config'
import { balanceTransport } from '../transport/balance'

export const inputParameters = new InputParameters({
  addresses: {
    aliases: ['result'],
    required: true,
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
  },
  minConfirmations: {
    required: false,
    aliases: ['confirmations'],
    type: 'number',
    default: 0,
    validate: validator.integer({ min: 0, max: 64 }),
    description:
      'Number (integer, min 0, max 64) of blocks that must have been confirmed after the point against which the balance is checked (i.e. balance will be sourced from {latestBlockNumber - minConfirmations}',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Data: {
      result: {
        address: string
        balance: string
      }[]
    }
    Result: null
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'balance',
  transport: balanceTransport,
  inputParameters,
})
