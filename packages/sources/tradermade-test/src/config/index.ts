import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'API endpoint for tradermade',
      default: 'https://marketdata.tradermade.com/api/v1/live',
      type: 'string',
    },
    API_KEY: {
      description:
        'An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api)',
      type: 'string',
      required: true,
      sensitive: true,
    },
    WS_API_KEY: {
      description:
        'An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api)',
      type: 'string',
      sensitive: true,
    },
    WS_API_ENDPOINT: {
      type: 'string',
      default: 'wss://marketdata.tradermade.com/feedadv',
      description: 'The Websocket endpoint to connect to for forex data',
    },
    WS_ENABLED: {
      description: 'Whether data should be returned from websocket or not',
      type: 'boolean',
      default: false,
    },
  },
  {
    envDefaultOverrides: {
      // Setting higher cache max age and background execute timeout due to low rate limits
      CACHE_MAX_AGE: 140_000,
      BACKGROUND_EXECUTE_TIMEOUT: 140_000,
    },
  },
)
