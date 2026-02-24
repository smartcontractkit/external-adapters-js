import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  DINARI_RPC_URL: {
    description: 'RPC URL for the Dinari chain',
    type: 'string',
    required: true,
  },
  DINARI_CHAIN_ID: {
    description: 'Chain ID for the Dinari network',
    type: 'number',
    required: true,
  },
  INDEX_CONTRACT_ADDRESS: {
    description: 'Address of the Dinari index smart contract',
    type: 'string',
    required: true,
  },
  TOKEN_ALLOCATION_ADAPTER_URL: {
    description: 'URL of the token-allocation EA for fetching prices',
    type: 'string',
    required: true,
  },
  TOKEN_ALLOCATION_SOURCE: {
    description:
      'The source adapter to use for fetching prices (e.g., coingecko, coinmarketcap, tiingo)',
    type: 'string',
    required: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
