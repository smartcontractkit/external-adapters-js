import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  PRIVATE_KEY: {
    description: 'A Private key for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_PROXY: {
    description: 'An API proxy for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://open-api.ceffu.com',
  },
  ARBITRUM_RPC_URL: {
    description: 'RPC url of Arbitrum node',
    type: 'string',
    required: true,
  },
  ARBITRUM_RPC_CHAIN_ID: {
    description: 'Arbitrum chain id',
    type: 'number',
    default: 42161,
  },

  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
