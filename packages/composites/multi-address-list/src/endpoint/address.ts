import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { addressListTransport } from '../transport/address'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { walletParameters as anchorageParams } from '@chainlink/anchorage-adapter'
import { walletParameters as coinbasePrimeParams } from '@chainlink/coinbase-prime-adapter'
import { walletParameters as bitGoParams } from '@chainlink/bitgo-adapter'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

export const inputParameters = new InputParameters({
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
  anchorage: {
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
  coinbase_prime: {
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
  name: 'address',
  transport: addressListTransport,
  inputParameters,
  customInputValidation: (request, adapterSettings): AdapterInputError | undefined => {
    // Check if the required environment variables for source EAs are set.
    const { chainId, network, ...sources } = request.requestContext.data

    Object.keys(sources).forEach((source) => {
      const envName = `${source.toUpperCase()}_ADAPTER_URL` as keyof typeof adapterSettings
      const params = sources[source as keyof typeof sources]
      if (params && !adapterSettings[envName]) {
        throw new AdapterInputError({
          statusCode: 400,
          message: `Error: missing environment variable ${envName}`,
        })
      }
      return
    })
    return
  },
})
