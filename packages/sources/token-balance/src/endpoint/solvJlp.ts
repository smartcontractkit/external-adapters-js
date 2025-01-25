import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { solvJlpBalanceTransport } from '../transport/solvJlp'

export const inputParameters = new InputParameters(
  {
    addresses: {
      required: true,
      type: {
        token: {
          required: false,
          type: 'string',
          description: 'only JLP will be processed',
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
    jlpUsdContract: {
      type: 'string',
      description: 'JLP/USD price feed on arbitrum',
      default: '0x702609AFaDda5b357bc7b0C5174645a4438A99F3',
    },
    btcUsdContract: {
      type: 'string',
      description: 'BTC/USD price feed on arbitrum',
      default: '0x6ce185860a4963106506C203335A2910413708e9',
    },
  },
  [
    {
      addresses: [
        {
          token: 'JLP',
          contractAddress: '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4',
          wallets: ['9P9MwtNknCNZkWLqgkuofM2b8FEDE8jNJxhnuSkHnhrf'],
        },
      ],
      jlpUsdContract: '0x702609AFaDda5b357bc7b0C5174645a4438A99F3',
      btcUsdContract: '0x6ce185860a4963106506C203335A2910413708e9',
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
      jlpUSD: {
        value: string
        decimals: number
      }
      btcUSD: {
        value: string
        decimals: number
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'solvJlp',
  transport: solvJlpBalanceTransport,
  inputParameters,
})
