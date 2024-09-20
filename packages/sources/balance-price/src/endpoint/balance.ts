import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { balanceTransport } from '../transport/balance'

export const inputParameters = new InputParameters(
  {
    addresses: {
      array: true,
      type: {
        address: {
          type: 'string',
          description: 'An address to get the balance of',
          required: true,
        },
      },
      required: true,
      description: 'The addresses to check the balance of',
    },
    blockNumber: {
      type: 'number',
      required: false,
      description: 'The block number to check the balance at',
    },
  },
  [
    {
      addresses: [
        { address: '0x61E5E1ea8fF9Dc840e0A549c752FA7BDe9224e99' },
        { address: '0x22f44f27A25053C9921037d6CDb5EDF9C05d567D' },
      ],
      blockNumber: 6709240,
    },
  ],
)

type AddressBalance = {
  address: string
  balance: string
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: AddressBalance[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'balance',
  aliases: [],
  transport: balanceTransport,
  inputParameters,
  overrides: overrides['balance-price'],
})
