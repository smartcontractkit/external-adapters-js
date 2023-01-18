export const customSettings = {
  API_KEY: {
    description: 'An API key that can be obtained from  [here](https://www.coinapi.io/pricing)',
    type: 'string',
    sensitive: true,
    required: true,
  },
  WS_API_ENDPOINT: {
    description: 'The websocket url for coinapi',
    type: 'string',
    default: 'wss://ws.coinapi.io/v1/',
  },
  WS_ENABLED: {
    description: 'Whether data should be returned from websocket or not',
    type: 'boolean',
    default: false,
  },
  API_ENDPOINT: {
    description: 'The API url for coinapi',
    type: 'string',
    default: 'https://rest.coinapi.io/v1/',
  },
} as const
