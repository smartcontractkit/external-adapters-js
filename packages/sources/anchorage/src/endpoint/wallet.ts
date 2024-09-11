import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { walletTransport } from '../transport/wallet'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { getApiInfo } from '../transport/utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = new InputParameters(
  {
    vaultId: {
      required: true,
      aliases: ['vaultID'],
      type: 'string',
      description: 'customerId',
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
    apiKeyName: {
      type: 'string',
      description: 'Used to select {$apiKeyName}_API_KEY in environment variables',
      required: true,
    },
  },
  [
    {
      vaultId: '22ds243sa24f652dsa3',
      chainId: 'mainnet',
      network: 'bitcoin',
      apiKeyName: 'BTC',
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
  customInputValidation: (request): AdapterError | undefined => {
    if (request.requestContext.data.apiKeyName) {
      getApiInfo(request.requestContext.data.apiKeyName)
    }
    return
  },
})
