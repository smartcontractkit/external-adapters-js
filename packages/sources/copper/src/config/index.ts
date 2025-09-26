import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Data Provider - Copper',
    type: 'string',
    required: true,
    sensitive: true,
    array: true,
  },
  API_SECRET: {
    description: 'An API secret for Data Provider - Copper',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider - Copper',
    type: 'string',
    default: 'https://api.copper.co',
  },
  ETHEREUM_RPC_URL: {
    description: 'RPC url of Ethereum node',
    type: 'string',
    default: '',
  },
  ETHEREUM_RPC_CHAIN_ID: {
    description: 'Ethereum chain id',
    type: 'number',
    default: 1,
  },
  ARBITRUM_RPC_URL: {
    description: 'RPC url of Arbitrum node',
    type: 'string',
    default: '',
  },
  ARBITRUM_RPC_CHAIN_ID: {
    description: 'Arbitrum chain id',
    type: 'number',
    default: 42161,
  },
  BACKGROUND_EXECUTE_MS: {
    description: 'Background execute time in milliseconds',
    type: 'number',
    default: 1000,
  },
  GROUP_SIZE: {
    description:
      'Number of requests to execute asynchronously before the adapter waits to execute the next group of requests. Setting this lower than the default may result in lower performance from the adapter.',
    type: 'number',
    default: 25,
  },
})
