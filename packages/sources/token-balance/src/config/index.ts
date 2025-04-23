import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
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
  SOLANA_RPC_URL: {
    description: 'RPC url of Solana node',
    type: 'string',
    default: '',
  },
  SOLANA_COMMITMENT: {
    description: 'Solana transaction commitment level',
    type: 'string',
    default: 'finalized',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
  GROUP_SIZE: {
    description:
      'Number of requests to execute asynchronously before the adapter waits to execute the next group of requests. Setting this lower than the default may result in lower performance from the adapter.',
    type: 'number',
    default: 25,
  },
})
