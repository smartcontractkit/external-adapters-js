import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'An API endpoint for Superstate',
      type: 'string',
      default: 'https://api.superstate.co/v1',
    },
    TRANSACTION_API_KEY: {
      description: 'Api key for /v2/transactions API endpoints',
      type: 'string',
    },
    TRANSACTION_API_SECRET: {
      description: 'Api secret for /v2/transactions API endpoints',
      type: 'string',
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
    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 10_000,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 60 * 60 * 24 * 1000, // 24 hours, see main index.ts file for explanation
    },
  },
)
