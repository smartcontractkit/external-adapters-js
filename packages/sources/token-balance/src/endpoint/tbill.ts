import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { tbillTransport } from '../transport/tbill'

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
      },
      array: true,
      description: 'List of addresses to read',
    },
    ethTBillPriceContract: {
      type: 'string',
      description: 'Address of ethereum token contract',
      default: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
    },
    arbTBillPriceContract: {
      type: 'string',
      description: 'Address of arbitrum token contract',
      default: '0xc0952c8ba068c887B675B4182F3A65420D045F46',
    },
  },
  [
    {
      addresses: [
        {
          network: 'Ethereum Mainnet',
          chainId: '1',
          token: 'TBILL',
          contractAddress: '0xdd50C053C096CB04A3e3362E2b622529EC5f2e8a',
        },
      ],
      ethTBillPriceContract: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
      arbTBillPriceContract: '0xc0952c8ba068c887B675B4182F3A65420D045F46',
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
  name: 'tbill',
  transport: tbillTransport,
  inputParameters,
})
