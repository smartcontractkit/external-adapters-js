export const defaultEndpoint = 'price'

export const customSettings = {
  API_ENDPOINT: {
    description: 'The API url for intrinio',
    type: 'string',
    default: 'https://api-v2.intrinio.com/',
  },
  API_KEY: {
    description: 'The API key for intrinio',
    type: 'string',
    require: true,
  },
  WS_ENABLED: {
    description: 'Whether data should be returned from websocket or not',
    type: 'boolean',
    default: false,
  },
  WS_API_ENDPOINT: {
    description: 'The websocket url for intrinio',
    type: 'string',
  },
} as const
