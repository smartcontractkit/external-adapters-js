import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { config } from '../config'
import { httpTransport } from '../transport/address'

export const inputParameters = new InputParameters(
  {
    network: {
      description: 'The network name to associate with the addresses',
      type: 'string',
      required: true,
    },
    chainId: {
      description: 'The chain ID to associate with the addresses',
      type: 'string',
      required: true,
    },
  },
  [
    {
      network: 'bitcoin',
      chainId: 'mainnet',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRAddressResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRAddressEndpoint({
  name: 'address',
  aliases: [],
  transport: httpTransport,
  inputParameters,
})
