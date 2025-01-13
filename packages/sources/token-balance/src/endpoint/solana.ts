import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { solanaBalanceTransport } from '../transport/solana'

export const inputParameters = new InputParameters(
  {
    addresses: {
      required: true,
      type: {
        network: {
          aliases: ['chain'],
          required: false,
          type: 'string',
          description: 'Network of the contract, only solana will be processed',
        },
        contractAddress: {
          required: true,
          type: 'string',
          description: 'Address of token contract',
        },
        wallets: {
          required: true,
          type: 'string',
          array: true,
          description: 'Array of wallets to sum balances',
        },
      },
      array: true,
      description: 'List of addresses to read',
    },
  },
  [
    {
      addresses: [
        {
          network: 'solana',
          contractAddress: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4',
          wallets: ['9P9MwtNknCNZkWLqgkuofM2b8FEDE8jNJxhnuSkHnhrf'],
        },
      ],
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      decimals: number
      wallets: {
        token: string
        wallet: string
        value: string
        decimals: number
      }[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'solana',
  transport: solanaBalanceTransport,
  inputParameters,
})
