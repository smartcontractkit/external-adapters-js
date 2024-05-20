import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import {
  PoRAddressEndpoint,
  PoRAddressResponse,
} from '@chainlink/external-adapter-framework/adapter/por'
import { config } from '../config'
import { walletTransport } from '../transport/wallet'

export const inputParameters = new InputParameters(
  {
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
  },
  [
    {
      portfolio: 'abcd1234-123a-1234-ab12-12a34bcd56e7',
      symbols: ['BTC'],
      type: 'vault',
      chainId: 'mainnet',
      network: 'bitcoin',
      batchSize: 10,
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
