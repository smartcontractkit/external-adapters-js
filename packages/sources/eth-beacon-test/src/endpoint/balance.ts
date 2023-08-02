import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
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
  stateId: {
    required: false,
    type: 'string',
    description: 'The beacon chain state ID to query',
    default: 'finalized',
  },
  validatorStatus: {
    required: false,
    array: true,
    type: 'string',
    description: 'A filter to apply validators by their status',
  },
  searchLimboValidators: {
    type: 'boolean',
    description:
      'Flag to determine if deposit events need to be searched for limbo validators. Only set to true if using an archive node.',
    default: false,
    required: false,
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: null
    Data: {
      result: { balance: string }[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'balance',
  transport: balanceTransport,
  inputParameters,
})
