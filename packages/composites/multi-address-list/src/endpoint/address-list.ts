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

export const inputParameters = new InputParameters(
  {
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
  },
  [
    {
      anchorage: {
        vaultId: 'b0bb5449c1e4926542ce693b4db2e883',
        network: 'ethereum',
        chainId: 'mainnet',
        endpoint: 'wallet',
      },
      bitgo: {
        coin: 'BTC',
        reserve: 'BTC',
        network: 'bitcoin',
        chainId: 'mainnet',
        endpoint: 'wallet',
      },
      coinbasePrime: {
        batchSize: 100,
        chainId: 'mainnet',
        network: 'bitcoin',
        type: 'vault',
        portfolio: 'sdas22s-dssw-dsw21-2231-dje72f9sj2',
        symbols: ['BTC'],
        apiKey: '',
        endpoint: 'wallet',
      },
    },
  ],
)

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
