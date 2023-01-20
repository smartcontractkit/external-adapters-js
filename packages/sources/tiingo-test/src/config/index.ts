export const customSettings = {
  API_ENDPOINT: {
    description: 'API endpoint for tiingo',
    default: 'https://api.tiingo.com/',
    type: 'string',
  },
  API_KEY: {
    description: 'API key for tiingo',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_ENABLED: {
    description: 'Whether data should be returned from websocket or not',
    type: 'boolean',
    default: false,
  },
  WS_API_ENDPOINT: {
    description: 'websocket endpoint for tiingo',
    default: 'wss://api.tiingo.com',
    type: 'string',
  },
} as const
