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
    API_FREQUENCY: {
      description: 'Frequency of API calls in minutes',
      type: 'number',
      default: 20,
      required: false,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 20 * 60 * 1000, // 20 minutes - max validated setting
    },
  },
)
