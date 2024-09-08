import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { addressListTransport } from '../transport/address-list'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { walletParameters as anchorageParams } from '@chainlink/anchorage-adapter'
import { walletParameters as coinbasePrimeParams } from '@chainlink/coinbase-prime-adapter'
import { walletParameters as bitGoParams } from '@chainlink/bitgo-adapter'

export const inputParameters = new InputParameters({
  anchorage: {
    required: true,
    type: {
      ...anchorageParams.definition,
      endpoint: {
        type: 'string',
        description: 'Endpoint name to make a request to',
        default: 'wallet',
      },
    },
    description: 'Input parameters for the Anchorage EA',
  },
  bitgo: {
    required: true,
    type: {
      ...bitGoParams.definition,
      endpoint: {
        type: 'string',
        description: 'Endpoint name to make a request to',
        default: 'wallet',
      },
    },
    description: 'Input parameters for the Bitgo EA',
  },
  coinbasePrime: {
    required: true,
    type: {
      ...coinbasePrimeParams.definition,
      endpoint: {
        type: 'string',
        description: 'Endpoint name to make a request to',
        default: 'wallet',
      },
    },
    description: 'Input parameters for the Coinbase Prime EA',
  },
})

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: PoRAddressResponse
  Settings: typeof config.settings
}

export const endpoint = new PoRAddressEndpoint({
  name: 'address-list',
  transport: addressListTransport,
  inputParameters,
})
