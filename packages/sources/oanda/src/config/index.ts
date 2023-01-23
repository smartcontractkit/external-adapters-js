export const customSettings = {
  API_KEY: {
    description: 'API key',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ACCOUNT_ID: {
    description: 'API Account ID',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'Endpoint for REST prices.',
    type: 'string',
    default: 'https://api-fxtrade.oanda.com/v3',
  },
  SSE_API_ENDPOINT: {
    description: 'Endpoint for SSE streaming prices.',
    type: 'string',
    default: 'https://stream-fxtrade.oanda.com/v3',
  },
} as const
