import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { addressListTransport } from '../transport/address-list'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'

export const inputParameters = new InputParameters({
  anchorage: {
    required: true,
    type: {
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
      portfolio: {
        required: true,
        type: 'string',
        description: 'The portfolio ID to query the balance of',
      },
      symbols: {
        required: true,
        array: true,
        type: 'string',
        description: 'The symbol to return the balance for',
      },
      type: {
        type: 'string',
        description: 'The balance type to return',
        default: 'vault',
        options: ['vault', 'trading', 'wallet_type_other', 'web3'],
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
      batchSize: {
        type: 'number',
        description: 'The number of addresses to fetch at a time',
        default: 100,
      },
      apiKey: {
        type: 'string',
        description:
          'Alternative api keys to use for this request, {$apiKey}_ACCESS_KEY {$apiKey}_PASSPHRASE {$apiKey}_SIGNING_KEY required in environment variables',
        default: '',
      },
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
