export const DEFAULT_API_ENDPOINT = 'https://api.tradingeconomics.com/markets'
export const DEFAULT_WS_API_ENDPOINT = 'wss://stream.tradingeconomics.com/'

export const defaultEndpoint = 'price'

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
  API_CLIENT_KEY: {
    description: 'The TradingEconomics API client key',
    type: 'string',
  },
  API_CLIENT_SECRET: {
    description: 'The TradingEconomics API client secret',
    type: 'string',
  },
  WS_API_KEY: {
    description: 'The websocket API key to authenticate with, if different from API_KEY',
    type: 'string',
    sensitive: true,
  },
  WS_ENABLED: {
    description: 'Whether data should be returned from websocket or not',
    type: 'boolean',
    default: false,
  },
} as const
