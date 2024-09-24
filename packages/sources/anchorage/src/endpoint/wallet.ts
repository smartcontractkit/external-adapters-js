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
      description: 'Id of the vault',
    },
    coin: {
      required: true,
      type: 'string',
      description: 'Asset ticker name',
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
      vaultId: '22ds243sa24f652dsa3',
      coin: 'BTC',
      chainId: 'mainnet',
      network: 'bitcoin',
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
    if (request.requestContext.data.coin) {
      getApiInfo(request.requestContext.data.coin)
    }
    return
  },
})
