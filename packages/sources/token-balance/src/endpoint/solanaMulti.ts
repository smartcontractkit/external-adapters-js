import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { solanaMultiTransport } from '../transport/solanaMulti'

export const inputParameters = new InputParameters(
  {
    addresses: {
      required: true,
      description:
        'List of addresses in the format returned by the multichainAddress endpoint por-address-list.',
      type: {
        token: {
          required: true,
          type: 'string',
          description: 'Token the address is associated with to filter addresses by token',
        },
        network: {
          required: true,
          type: 'string',
          description: 'Addresses with a network other than SOLANA will be ignored',
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
    },
    token: {
      required: true,
      description: 'Token symbol used to filter addresses',
      type: 'string',
    },
    priceOracle: {
      required: false,
      description:
        'Configuration of the on-chain price oracle that provides real-time token valuations.',
      type: {
        contractAddress: {
          required: true,
          type: 'string',
          description: 'Contract address of the price oracle used to fetch token price data.',
        },
        network: {
          required: true,
          type: 'string',
          description:
            'Blockchain network of the price oracle contract (e.g., ETHEREUM, ARBITRUM).',
        },
      },
    },
  },
  [
    {
      addresses: [
        {
          token: 'WBTC',
          network: 'SOLANA',
          contractAddress: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh',
          wallets: ['EXrqY7jLTLp83H38L8Zw3GvGkk1KoQbYTckPGBghwD8X'],
        },
      ],
      token: 'WBTC',
      priceOracle: {
        contractAddress: '0xfdFD9C85aD200c506Cf9e21F1FD8dd01932FBB23',
        network: 'ETHEREUM',
      },
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
      tokenPrice: {
        value: string
        decimals: number
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'solanaMulti',
  transport: solanaMultiTransport,
  inputParameters,
})
