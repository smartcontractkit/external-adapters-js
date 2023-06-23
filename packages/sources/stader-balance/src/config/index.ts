import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    ETHEREUM_RPC_URL: {
      type: 'string',
      description: 'The RPC URL to connect to the EVM chain.',
      required: true,
    },
    BEACON_RPC_URL: {
      type: 'string',
      description: 'The RPC URL of an Ethereum beacon node',
      required: true,
    },
    CHAIN_ID: {
      type: 'number',
      description: 'The chain id to connect to',
      default: 1,
    },
    BATCH_SIZE: {
      type: 'number',
      description:
        'The size of batches the addresses are split into for each request to the consensus client. Set to 0 if consensus client allows unlimited validators in query.',
      default: 15,
    },
    GROUP_SIZE: {
      type: 'number',
      description:
        'Number of requests to execute asynchronously before the adapter waits to execute the next batch',
      default: 25,
    },
    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 10_000,
    },
  },
  {
    envDefaultOverrides: {
      BACKGROUND_EXECUTE_TIMEOUT: 180_000,
    },
  },
)
