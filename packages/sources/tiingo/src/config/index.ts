import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { validator } from '@chainlink/external-adapter-framework/validation/utils'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'API endpoint for tiingo',
      default: 'https://api.tiingo.com/',
      type: 'string',
      sensitive: false,
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
      sensitive: false,
    },
    SECONDARY_WS_API_ENDPOINT: {
      description:
        'Secondary websocket endpoint for tiingo. To effectively disable failover and use only the primary URL, set this to the same value as WS_API_ENDPOINT.',
      default: 'wss://api.redundantstack.com',
      type: 'string',
      sensitive: false,
    },
    WS_URL_PRIMARY_ATTEMPTS: {
      description:
        'Number of consecutive connection attempts to primary WebSocket URL per failover cycle (alternates with secondary)',
      default: 5,
      type: 'number',
      validate: validator.integer({ min: 1, max: 10 }),
      sensitive: false,
    },
    WS_URL_SECONDARY_ATTEMPTS: {
      description:
        'Number of consecutive connection attempts to secondary WebSocket URL per failover cycle (alternates with primary)',
      default: 1,
      type: 'number',
      validate: validator.integer({ min: 1, max: 10 }),
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 150_000, // see known issues in readme
      WS_SUBSCRIPTION_TTL: 180_000,
    },
  },
)
