import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'API endpoint for tiingo',
      default: 'https://api.tiingo.com/',
      type: 'string',
      sensitive: false,
    },
    API_KEY: {
      description:
        'API key for tiingo, valid for all endpoints except stock_quotes (stock_quotes with assetType indices uses this key)',
      type: 'string',
      required: true,
      sensitive: true,
    },
    EQUITIES_API_KEY: {
      description: 'API key for tiingo, valid the stock_quotes endpoints',
      type: 'string',
      required: false,
      sensitive: true,
    },
    WS_API_ENDPOINT: {
      description: 'Websocket endpoint for tiingo',
      default: 'wss://api.tiingo.com',
      type: 'string',
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
