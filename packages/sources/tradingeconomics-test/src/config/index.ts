export const defaultEndpoint = 'price'
export const customSettings = {
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: 'https://api.tradingeconomics.com/markets',
    required: true,
  },
  WS_API_ENDPOINT: {
    description: 'The WS URL to retrieve data from',
    type: 'string',
    default: 'wss://stream.tradingeconomics.com/',
    required: true,
  },
  API_CLIENT_KEY: {
    description: 'The TradingEconomics API client key',
    type: 'string',
    required: true,
  },
  API_CLIENT_SECRET: {
    description: 'The TradingEconomics API client secret',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_ENABLED: {
    description: 'Whether data should be returned from websocket or not',
    type: 'boolean',
    default: false,
  },
} as const
