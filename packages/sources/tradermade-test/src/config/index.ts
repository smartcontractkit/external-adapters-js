export const customSettings = {
  API_ENDPOINT: {
    description: 'API endpoint for tradermade',
    default: 'https://marketdata.tradermade.com/api/v1/live',
    type: 'string',
  },
  API_KEY: {
    description:
      'An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api)',
    type: 'string',
  },
  WS_ENABLED: {
    description: 'Whether data should be returned from websocket or not',
    type: 'boolean',
    default: false,
  },
  WS_API_KEY: {
    description:
      'An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api)',
    type: 'string',
  },
} as const
