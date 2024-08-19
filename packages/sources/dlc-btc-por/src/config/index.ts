import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    EVM_RPC_BATCH_SIZE: {
      description: 'Number of vaults to fetch from a DLC contract at a time',
      type: 'number',
      default: 100,
    },
    BITCOIN_RPC_URL: {
      description: 'THE RPC URL of bitcoin node',
      type: 'string',
      required: true,
    },
    BITCOIN_NETWORK: {
      description: 'Bitcoin network name',
      type: 'enum',
      default: 'mainnet',
      options: ['mainnet', 'testnet', 'regtest'],
    },
    CONFIRMATIONS: {
      description: 'The number of confirmations to query data from',
      type: 'number',
      default: 6,
    },
    BITCOIN_RPC_GROUP_SIZE: {
      description: 'The number of concurrent RPC calls to BITCOIN_RPC_URL to make at a time.',
      type: 'number',
      default: 30,
    },
    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 10_000,
    },
  },
  {
    // The EA will potentially make several hundreds or thousands RPC calls during each cycle.
    // Higher values for the following configs are set to make sure that the EA is able to process the requests
    envDefaultOverrides: {
      BACKGROUND_EXECUTE_TIMEOUT: 180_000,
      API_TIMEOUT: 60_000,
      CACHE_MAX_AGE: 360_000,
    },
  },
)
