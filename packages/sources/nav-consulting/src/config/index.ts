import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'An API endpoint for Data Provider',
      type: 'string',
      default: 'https://api.navconsulting.net',
    },

    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 60_000, // one call per minute
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 600_000, // 10 minute cache
    },
  },
)
