import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    P_CHAIN_RPC_URL: {
      description:
        'Full RPC URL for the avalanche platform chain (e.g. https://api.avax.network/ext/bc/P)',
      type: 'string',
      required: true,
    },
    GROUP_SIZE: {
      description:
        'Number of requests to execute asynchronously before the adapter waits to execute the next group of requests.',
      type: 'number',
      default: 10,
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
      API_TIMEOUT: 60000,
    },
  },
)
