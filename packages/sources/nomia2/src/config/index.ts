import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_KEY: {
      description: 'An API key for Data Provider',
      type: 'string',
      required: true,
      sensitive: true,
    },
    API_ENDPOINT: {
      description: 'An API endpoint for Data Provider',
      type: 'string',
      required: true,
      sensitive: true,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 60 * 20 * 1000, // 20 minutes to account for slow rate limiter, max allowed without circumventing framework max
    },
  },
)
