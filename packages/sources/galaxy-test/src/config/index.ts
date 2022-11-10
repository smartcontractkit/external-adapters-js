export const DEFAULT_BASE_URL = 'https://data.galaxy.com/v1.0/login'
export const DEFAULT_WS_API_ENDPOINT = 'wss://data.galaxy.com/v1.0/ws'

export const customSettings = {
  API_KEY: {
    description: 'Key for the Galaxy API',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_PASSWORD: {
    description: 'Password for the Galaxy API',
    type: 'string',
    required: true,
    sensitive: true,
  },
} as const
