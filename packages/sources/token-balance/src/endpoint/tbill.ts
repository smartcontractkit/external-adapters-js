import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { tbillTransport } from '../transport/tbill'

export const inputParameters = new InputParameters(
  {
    addresses: {
      required: true,
      type: {
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
        priceOracleAddress: {
          required: true,
          type: 'string',
          description: 'Address of price oracle',
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
          chainId: '1',
          contractAddress: '0xdd50C053C096CB04A3e3362E2b622529EC5f2e8a',
          priceOracleAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
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
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'tbill',
  transport: tbillTransport,
  inputParameters,
})
