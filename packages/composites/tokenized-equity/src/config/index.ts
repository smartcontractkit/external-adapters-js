import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  DATA_ENGINE_ADAPTER_URL: {
    description: 'URL of data engine ea',
    type: 'string',
    required: true,
    sensitive: false,
  },
  TRADING_HOURS_ADAPTER_URL: {
    description: 'URL of tradinghours ea',
    type: 'string',
    required: true,
    sensitive: false,
  },
  ETHEREUM_RPC_URL: {
    description: 'RPC URL of a Mainnet ETH node',
    type: 'string',
    default: '',
    sensitive: true,
  },
  ETHEREUM_RPC_CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    default: 1,
    sensitive: false,
  },
  BASE_RPC_URL: {
    description: 'RPC URL of a Mainnet Base node',
    type: 'string',
    default: '',
    sensitive: true,
  },
  BASE_RPC_CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    default: 8453,
    sensitive: false,
  },
  ROBINHOOD_NETWORK_RPC_URL: {
    description:
      'JSON RPC URL for robinhood endpoint. ${NETWORK} should be "mainnet" or "testnet".',
    type: 'string',
    required: true,
    variablePlaceholder: 'NETWORK',
    sensitive: true,
  },
  ROBINHOOD_NETWORK_CHAIN_ID: {
    description: 'Chain ID for the Robinhood chain. ${NETWORK} should be "mainnet" or "testnet".',
    type: 'number',
    required: true,
    variablePlaceholder: 'NETWORK',
  },

  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 1_000,
    sensitive: false,
  },
})
