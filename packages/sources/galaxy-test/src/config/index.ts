export const customSettings = {
  API_ENDPOINT: {
    description: 'Base URL for the REST Galaxy API',
    type: 'string',
    required: false,
    default: 'https://data.galaxy.com/v1.0/login',
  },
  WS_API_ENDPOINT: {
    description: 'WS URL for the Galaxy API',
    type: 'string',
    required: false,
    default: 'wss://data.galaxy.com/v1.0/ws',
  },
  WS_API_KEY: {
    description: 'Key for the Galaxy API',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_PASSWORD: {
    description: 'Password for the Galaxy API',
    type: 'string',
    required: true,
    sensitive: true,
  },
} as const
