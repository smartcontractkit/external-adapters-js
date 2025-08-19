import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { usdoSolanaTransport } from '../transport/usdoSolana'

export const inputParameters = new InputParameters(
  {
    addresses: {
      required: true,
      description: 'Array of wallets to sum balances',
      type: {
        network: {
          required: false,
          type: 'string',
          description: 'Network of the contract',
        },
        chainId: {
          required: false,
          type: 'string',
          description: 'Chain ID of the network',
        },
        address: {
          required: true,
          type: 'string',
          description: 'Address of token contract',
        },
      },
      array: true,
    },
    tokenMint: {
      required: true,
      description: 'token mint - an on-chain account that defines a token’s metadata',
      type: {
        token: {
          required: false,
          type: 'string',
          description: 'Token symbol',
        },
        contractAddress: {
          required: true,
          type: 'string',
          description: 'Address of token mint',
        },
      },
    },
    priceOracle: {
      required: true,
      description: 'price Oracle',
      type: {
        contractAddress: {
          required: true,
          type: 'string',
          description: 'Address of price oracle contract',
        },
        chainId: {
          required: true,
          type: 'string',
          description: 'Chain ID of the network',
        },
        network: {
          required: true,
          type: 'string',
          description: 'Network of contractAddress ',
        },
      },
    },
  },
  [
    {
      addresses: [
        {
          address: 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG',
          network: 'SOLANA',
          chainId: '0',
        },
      ],
      tokenMint: {
        token: 'TBILL',
        contractAddress: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6 ',
      },
      priceOracle: {
        contractAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
        chainId: '1',
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
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'usdoSolana',
  transport: usdoSolanaTransport,
  inputParameters,
})
