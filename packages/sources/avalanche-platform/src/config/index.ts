import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    P_CHAIN_RPC_URL: {
      description:
        'Full RPC URL for the avalanche platform chain (e.g. https://api.avax.network/ext/bc/P)',
      type: 'string',
      required: true,
    },
  },
  {
    envDefaultOverrides: {
      API_TIMEOUT: 60000,
    },
  },
)
