import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { anchorageTransport } from '../transport/wallet'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'

export const inputParameters = new InputParameters(
  {
    customerId: {
      required: true,
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
  },
  [
    {
      customerId: '22ds243sa24f652dsa3',
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
  transport: anchorageTransport,
  inputParameters,
})
