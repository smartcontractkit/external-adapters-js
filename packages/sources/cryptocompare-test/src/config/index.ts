export const DEFAULT_API_ENDPOINT = 'https://min-api.cryptocompare.com'
export const DEFAULT_WS_API_ENDPOINT = 'wss://streamer.cryptocompare.com/v2'

export const defaultEndpoint = 'crypto'

export const customSettings = {
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: DEFAULT_API_ENDPOINT,
    required: true,
  },
  WS_API_ENDPOINT: {
    description: 'The WS URL to retrieve data from',
    type: 'string',
    default: DEFAULT_WS_API_ENDPOINT,
    required: true,
  },
  API_KEY: {
    description: 'The CryptoCompare API key',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_KEY: {
    description: 'The websocket API key to authenticate with, if different from API_KEY',
    type: 'string',
    sensitive: true,
  },
} as const
