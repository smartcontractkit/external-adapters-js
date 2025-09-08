import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import PriceFeeds from '../config/priceFeeds.json'
import { walletTransport } from '../transport/wallet/transport'
import { getApiKeys } from '../transport/wallet/utils'

export const inputParameters = new InputParameters(
  {
    client: {
      required: true,
      type: 'string',
      description: 'Name of the client, used to match API keys in env var',
    },
    contracts: {
      type: {
        token: {
          required: true,
          type: 'string',
          description: 'Name of the token',
        },
        address: {
          required: true,
          type: 'string',
          description: 'Contract address',
        },
      },
      array: true,
      description:
        'List of */USD price feeds on arbitrum, if not provided we will fallback to priceFeeds.json',
    },
    decimals: {
      description: 'Number of decimals of response',
      type: 'number',
      required: true,
    },
  },
  [
    {
      client: 'c1',
      contracts: [
        {
          token: 'USDT',
          address: '0x000',
        },
      ],
      decimals: 18,
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
      results: {
        coin: string
        amount: string
        rate: string
        decimal: number
        value: string
      }[]
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'wallet',
  transport: walletTransport,
  inputParameters,
  requestTransforms: [
    (request) => {
      request.requestContext.data.contracts.forEach((c) => {
        c.token = c.token.toUpperCase()
      })

      const inputToken = new Set(request.requestContext.data.contracts.map((c) => c.token))

      PriceFeeds.forEach((p) => {
        if (!inputToken.has(p.token.toUpperCase())) {
          request.requestContext.data.contracts.push({
            token: p.token.toUpperCase(),
            address: p.address,
          })
        }
      })
    },
  ],
  customInputValidation: (req): AdapterInputError | undefined => {
    getApiKeys(req.requestContext.data.client)
    return
  },
})
