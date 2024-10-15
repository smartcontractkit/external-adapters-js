import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { walletTransport } from '../transport/wallet'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'

export const inputParameters = new InputParameters(
  {
    coin: {
      type: 'string',
      description: 'A cryptocurrency symbol or token ticker symbol',
      required: true,
    },
    enterpriseId: {
      type: 'string',
      description: 'Enterprise ID',
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
  },
  [
    {
      coin: 'btc',
      chainId: 'mainnet',
      network: 'bitcoin',
      enterpriseId: '4322ssfsar4ss',
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
})
