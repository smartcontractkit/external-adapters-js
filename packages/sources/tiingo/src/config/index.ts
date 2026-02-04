import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'API endpoint for tiingo',
      default: 'https://api.tiingo.com/',
      type: 'string',
    },
    API_KEY: {
      description: 'API key for tiingo, valid for all endpoints',
      type: 'string',
      required: true,
      sensitive: true,
    },
    WS_API_ENDPOINT: {
      description: 'Websocket endpoint for tiingo',
      default: 'wss://api.tiingo.com',
      type: 'string',
    },
    SECONDARY_WS_API_ENDPOINT: {
      description: 'Secondary websocket endpoint for tiingo',
      default: 'wss://api.redundantstack.com',
      type: 'string',
    },
    WS_URL_PRIMARY_ATTEMPTS: {
      description:
        'Number of consecutive connection attempts to primary WebSocket URL per failover cycle (alternates with secondary)',
      default: 1,
      type: 'number',
    },
    WS_URL_SECONDARY_ATTEMPTS: {
      description:
        'Number of consecutive connection attempts to secondary WebSocket URL per failover cycle (alternates with primary)',
      default: 1,
      type: 'number',
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 150_000, // see known issues in readme
      WS_SUBSCRIPTION_TTL: 180_000,
    },
  },
)
