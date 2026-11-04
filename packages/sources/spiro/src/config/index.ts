import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'The base URL of the Spiro API, including the funds path',
      type: 'string',
      default: 'https://rwa-wireframes.vercel.app/api/chainlink/funds',
      sensitive: false,
    },
    API_KEY: {
      description: 'API key for the Spiro API, sent as the x-api-key header',
      type: 'string',
      required: true,
      sensitive: true,
    },
  },
  {
    // 20/min is a 3 s fixed interval. The default 2 s cache poll expires
    // before a queued request completes, so use the framework maximum.
    envDefaultOverrides: {
      CACHE_POLLING_MAX_RETRIES: 20,
      CACHE_POLLING_SLEEP_MS: 1000,
    },
  },
)
