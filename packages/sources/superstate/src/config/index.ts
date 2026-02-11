import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'An API endpoint for Superstate',
      type: 'string',
      default: 'https://api.superstate.com/v1',
      sensitive: false,
    },
    TRANSACTION_API_KEY: {
      description: 'Api key for /v2/transactions API endpoints',
      type: 'string',
      sensitive: true,
    },
    TRANSACTION_API_SECRET: {
      description: 'Api secret for /v2/transactions API endpoints',
      type: 'string',
      sensitive: true,
    },
    LOOKBACK_DAYS: {
      description: 'The number of days of historical data to retrieve',
      type: 'number',
      default: 10,
      sensitive: false,
    },
    RETRY_INTERVAL_MS: {
      description:
        'The amount of time (in ms) to wait before sending a new request for getting an updated price.',
      type: 'number',
      default: 60000,
      sensitive: false,
    },
    BACKGROUND_EXECUTE_MS: {
      description:
        'The amount of time the background execute should sleep before performing the next request',
      type: 'number',
      default: 10_000,
      sensitive: false,
    },
    NAV_CRON_INTERVAL_MIN: {
      description: 'How many minutes do we wait between each cron job that fetches Nav',
      type: 'number',
      default: 10,
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 60 * 60 * 24 * 1000, // 24 hours, see main index.ts file for explanation
    },
  },
)
