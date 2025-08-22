import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { solanaTransport } from '../transport/solana'

export const inputParameters = new InputParameters(
  {
    addresses: {
      required: true,
      description:
        'List of wallet addresses to query. The balances of all provided wallets will be retrieved and summed together.',
      type: {
        address: {
          required: true,
          type: 'string',
          description: 'Public wallet address whose token balance will be queried.',
        },
      },
      array: true,
    },
    tokenMint: {
      required: true,
      description:
        'Token mint information. A mint is the canonical on-chain account that defines the token’s metadata (name, symbol, supply rules).',
      type: {
        token: {
          required: false,
          type: 'string',
          description: 'Readable token symbol (e.g., USDC, TBILL). Used for reference only.',
        },
        contractAddress: {
          required: true,
          type: 'string',
          description: 'On-chain contract address of the token mint',
        },
      },
    },
    priceOracle: {
      required: true,
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
          address: 'G7v3P9yPtBj1e3JN7B6dq4zbkrrW3e2ovdwAkSTKuUFG',
        },
      ],
      tokenMint: {
        token: 'TBILL',
        contractAddress: '4MmJVdwYN8LwvbGeCowYjSx7KoEi6BJWg8XXnW4fDDp6 ',
      },
      priceOracle: {
        contractAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
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
  name: 'solana',
  transport: solanaTransport,
  inputParameters,
})
