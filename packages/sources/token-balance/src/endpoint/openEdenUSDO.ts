import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { openEdenUSDOTransport } from '../transport/openEdenUSDO'

export const inputParameters = new InputParameters(
  {
    addresses: {
      required: true,
      type: {
        network: {
          aliases: ['chain'],
          required: false,
          type: 'string',
          description: 'Network of the contract',
        },
        chainId: {
          required: false,
          type: 'string',
          description: 'Chain ID of the network',
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
    ethTBillPriceContract: {
      type: {
        network: {
          aliases: ['chain'],
          required: false,
          type: 'string',
          description: 'Network of the contract',
          default: 'Ethreum',
        },
        chainId: {
          required: false,
          type: 'string',
          description: 'Chain ID of the network',
          default: '1',
        },
        contractAddress: {
          required: false,
          type: 'string',
          description: 'Address of token contract',
          default: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
        },
      },
      description: 'TBill price feed on ethereum',
    },
    arbTBillPriceContract: {
      type: {
        network: {
          aliases: ['chain'],
          required: false,
          type: 'string',
          description: 'Network of the contract',
          default: 'Arbitrum',
        },
        chainId: {
          required: false,
          type: 'string',
          description: 'Chain ID of the network',
          default: '42161',
        },
        contractAddress: {
          required: false,
          type: 'string',
          description: 'Address of token contract',
          default: '0xc0952c8ba068c887B675B4182F3A65420D045F46',
        },
      },
      description: 'TBill price feed on arbitrum',
    },
  },
  [
    {
      addresses: [
        {
          network: 'Ethereum Mainnet',
          chainId: '1',
          contractAddress: '0xdd50C053C096CB04A3e3362E2b622529EC5f2e8a',
          wallets: ['0x0000000000000000000000000000000000000006'],
        },
      ],
      ethTBillPriceContract: {
        network: 'Ethereum Mainnet',
        chainId: '1',
        contractAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
      },
      arbTBillPriceContract: {
        network: 'Arbitrum',
        chainId: '42161',
        contractAddress: '0xc0952c8ba068c887B675B4182F3A65420D045F46',
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
  name: 'openEdenUSDO',
  transport: openEdenUSDOTransport,
  inputParameters,
})
