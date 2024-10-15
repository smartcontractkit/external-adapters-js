import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    WS_API_ENDPOINT: {
      description: 'websocket endpoint for tiingo',
      default: 'wss://api.tiingo.com',
      type: 'string',
    },
    API_KEY: {
      description: 'API key for tiingo',
      type: 'string',
      required: true,
      sensitive: true,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 150_000, // see known issues in readme
      WS_SUBSCRIPTION_TTL: 180_000,
    },
  },
)
