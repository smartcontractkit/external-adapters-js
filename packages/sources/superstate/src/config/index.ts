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
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 60 * 60 * 24 * 1000, // 24 hours, see main index.ts file for explanation
    },
  },
)
