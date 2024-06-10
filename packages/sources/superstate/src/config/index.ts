import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'An API endpoint for Superstate',
      type: 'string',
      default: 'https://api.superstate.co/v1',
    },
    LOOKBACK_DAYS: {
      description: 'The number of days of historical data to retrieve',
      type: 'number',
      default: 10,
    },
    RETRY_INTERVAL_MS: {
      description:
        'The amount of time (in ms) to wait before sending a new request for getting an updated price.',
      type: 'number',
      default: 60000,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 60 * 60 * 24 * 1000, // 24 hours, see main index.ts file for explanation
    },
  },
)
