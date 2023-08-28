import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { httpTransport } from '../transport/reserves'
import { config } from '../config'

export const inputParameters = new InputParameters({
  token: {
    aliases: ['asset', 'coin'],
    description: 'The symbol of the token to query',
    default: 'EFIL',
    type: 'string',
  },
  chainId: {
    description: 'An identifier for which network of the blockchain to use',
    type: 'string',
    default: 'mainnet',
  },
  network: {
    type: 'string',
    default: 'filecoin',
    description: 'The name of the target network protocol',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRAddressResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRAddressEndpoint({
  name: 'reserves',
  transport: httpTransport,
  inputParameters,
})
