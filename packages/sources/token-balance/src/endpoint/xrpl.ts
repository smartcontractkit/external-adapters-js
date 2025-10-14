import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { xrplTransport } from '../transport/xrpl'
import { getXrplRpcUrl } from '../transport/xrpl-utils'

export const inputParameters = new InputParameters(
  {
    tokenIssuerAddress: {
      required: true,
      type: 'string',
      description: 'Identifies the token, e.g., TBILL, to fetch the balance of',
    },
    priceOracleAddress: {
      required: true,
      type: 'string',
      description: 'Address of the price oracle contract to use to convert the above token to USD',
    },
    priceOracleNetwork: {
      required: true,
      type: 'string',
      description: 'EVM network on which to query the price oracle (ethereum, arbitrum, etc.)',
    },
    addresses: {
      required: true,
      type: {
        address: {
          required: true,
          type: 'string',
          description: 'Address of the account to fetch the balance of',
        },
      },
      array: true,
      description: 'List of addresses to read',
    },
  },
  [
    {
      tokenIssuerAddress: 'rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn',
      priceOracleAddress: '0xCe9a6626Eb99eaeA829D7fA613d5D0A2eaE45F40',
      priceOracleNetwork: 'ethereum',
      addresses: [
        {
          address: 'rGSA6YCGzywj2hsPA8DArSsLr1DMTBi2LH',
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
  name: 'xrpl',
  transport: xrplTransport,
  inputParameters,
  customInputValidation: (_request, settings): AdapterError | undefined => {
    getXrplRpcUrl(settings)
    return
  },
})
