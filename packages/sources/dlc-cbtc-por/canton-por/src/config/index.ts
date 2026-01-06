import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    CANTON_API_URL: {
      description: 'Digital Asset API endpoint URL for CBTC token metadata',
      type: 'string',
    },
    ATTESTER_API_URL: {
      description: 'Attester API base URL for CBTC supply',
      type: 'string',
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 10_000, // 10 seconds - refresh frequently for PoR data
    },
  },
)
