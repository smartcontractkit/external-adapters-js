import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { DataEngineV11Data, targetEndpoints } from '../lib/dataEngine'
import { issuerNames, validateMultiplierParams } from '../lib/multiplier'
import { issuerPrice247Transport } from '../transport/issuerPrice247'

export const inputParameters = new InputParameters(
  {
    targetEndpoint: {
      type: 'string',
      description: 'The data-engine EA endpoint to request the 24/7 feed from',
      options: Object.keys(targetEndpoints),
      default: 'v11',
    },
    feedId: {
      required: true,
      type: 'string',
      description: 'Data Streams feed ID of the 24/7 feed for the underlying asset',
    },
    resultPath: {
      required: true,
      type: 'string',
      description: 'The data-engine EA data field to use as the price, e.g. lastTradedPrice',
    },
    decimals: {
      type: 'number',
      description:
        'Decimals of output result, applied after the multiplier. With a multiplier the data-engine price is requested in the decimals of the on-chain multiplier, without one it is requested in these decimals',
      default: 8,
    },
    multiplier: {
      required: false,
      description:
        'On-chain multiplier applied to the price. When omitted, the raw stream price is returned',
      type: {
        issuer: {
          required: true,
          type: 'string',
          description: `The issuer of the tokenized asset. One of: ${issuerNames.join(', ')}`,
        },
        asset: {
          required: true,
          type: 'string',
          description: 'Token address of the tokenized asset',
        },
        registry: {
          required: false,
          type: 'string',
          description: 'Address of the issuer registry contract. Required for coinbase and ondo',
        },
        network: {
          required: true,
          type: 'string',
          description:
            'Network to read the multiplier from: ethereum (ETHEREUM_RPC_URL), base (BASE_RPC_URL), robinhood-mainnet (ROBINHOOD_MAINNET_RPC_URL) or robinhood-testnet (ROBINHOOD_TESTNET_RPC_URL)',
        },
      },
    },
  },
  [
    {
      targetEndpoint: 'v11',
      feedId: '0x000b0b1c31f90396e910c57ec94ed963271e4e39f15da3d92f81e273083ce4a1',
      resultPath: 'lastTradedPrice',
      decimals: 8,
      multiplier: {
        issuer: 'robinhood',
        asset: '0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3',
        network: 'robinhood-mainnet',
      },
    },
    {
      targetEndpoint: 'v11',
      feedId: '0x000b0b1c31f90396e910c57ec94ed963271e4e39f15da3d92f81e273083ce4a1',
      resultPath: 'lastTradedPrice',
      decimals: 8,
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
      rawPrice: string
      rawPriceDecimals: number
      // Only present when a multiplier is requested
      rawMultipliedPrice?: string
      rawMultipliedPriceDecimals?: number
      dataEngine: DataEngineV11Data
      multiplier?: {
        issuer: string
        network: string
        value: string
        decimals: number
        paused: boolean
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'issuer-price-247',
  transport: issuerPrice247Transport,
  inputParameters,
  customInputValidation: (req, adapterSettings): AdapterInputError | undefined => {
    const { multiplier } = req.requestContext.data
    if (multiplier) {
      validateMultiplierParams(adapterSettings, multiplier)
    }
    return
  },
})
