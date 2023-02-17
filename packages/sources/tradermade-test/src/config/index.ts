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
} as const
