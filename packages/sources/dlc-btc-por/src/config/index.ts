import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  RPC_URL: {
    description: 'The RPC URL to connect to the EVM chain',
    type: 'string',
    required: true,
  },
  CHAIN_ID: {
    description: 'The EVM chain id to connect to',
    type: 'number',
    required: true,
    default: 42161,
  },
  DLC_CONTRACT: {
    description: 'Contract address to fetch all funded vaults',
    required: true,
    type: 'string',
    default: '0x20157DBAbb84e3BBFE68C349d0d44E48AE7B5AD2',
  },
  BITCOIN_RPC_URL: {
    description: 'THE RPC URL of bitcoin node',
    type: 'string',
    required: true,
  },
  BITCOIN_NETWORK: {
    description: 'Bitcoin network name',
    type: 'enum',
    required: true,
    default: 'mainnet',
    options: ['mainnet', 'testnet', 'regtest'],
  },
  CONFIRMATIONS: {
    description: 'The number of confirmations to query data from',
    type: 'number',
    required: true,
    default: 6,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
