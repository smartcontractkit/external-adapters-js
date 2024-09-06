import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { walletTransport } from '../transport/wallet'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { getApiInfo } from '../transport/utils'

export const inputParameters = new InputParameters(
  {
    coin: {
      type: 'string',
      description: 'A cryptocurrency symbol or token ticker symbol',
      required: true,
    },
    chainId: {
      type: 'string',
      description: 'The ID of the chain to return',
      options: ['mainnet', 'testnet'],
      default: 'mainnet',
    },
    network: {
      type: 'string',
      description: 'The network to return',
      default: 'bitcoin',
    },
    reserve: {
      type: 'string',
      description:
        'Used to select {$reserve}_API_KEY {$reserve}_API_ENDPOINT {$reserve}_API_LIMIT in environment variables',
      required: true,
    },
  },
  [
    {
      coin: 'btc',
      chainId: 'mainnet',
      network: 'bitcoin',
      reserve: 'BTC',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRAddressResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRAddressEndpoint({
  name: 'wallet',
  transport: walletTransport,
  inputParameters,
  customInputValidation: (request, settings): AdapterError | undefined => {
    if (request.requestContext.data.reserve) {
      getApiInfo(request.requestContext.data.reserve, settings)
    }
    return
  },
})
