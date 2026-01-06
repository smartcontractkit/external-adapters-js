import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    CANTON_API_URL: {
      description: 'Digital Asset API endpoint URL for CBTC token metadata',
      type: 'string',
      required: false,
    },
    ATTESTER_API_URL: {
      description: 'Attester API base URL (e.g., https://mainnet.dlc.link/attestor-1)',
      type: 'string',
      required: false,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 10_000, // 10 seconds - refresh frequently for PoR data
    },
  },
)
