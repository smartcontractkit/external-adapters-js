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
  BASE_RPC_URL: {
    description: 'RPC url of Base node',
    type: 'string',
    default: '',
  },
  BASE_RPC_CHAIN_ID: {
    description: 'Base chain id',
    type: 'number',
    default: 8453,
  },
  SOLANA_RPC_URL: {
    description: 'Solana Rpc Url',
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
})
