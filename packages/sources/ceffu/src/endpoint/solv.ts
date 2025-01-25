import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { solvTransport } from '../transport/solv'

export const inputParameters = new InputParameters(
  {
    addresses: {
      required: true,
      type: {
        address: {
          required: true,
          type: 'string',
          description: 'mirrorXLinkId for CEFFU',
        },
      },
      array: true,
      description: 'List of addresses to read',
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
          address: '12345',
        },
      ],
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
      exchangeBalances: string[]
      rate: {
        value: string
        decimal: number
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'solv',
  transport: solvTransport,
  inputParameters,
})
