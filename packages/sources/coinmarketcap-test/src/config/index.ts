export const customSettings = {
  API_KEY: {
    required: true,
    sensitive: true,
    type: 'string',
    description: 'An API key that can be obtained from https://coinmarketcap.com/api/',
  },
  API_ENDPOINT: {
    required: false,
    type: 'string',
    description: 'An API endpoint for coinmarketcap',
    default: 'https://pro-api.coinmarketcap.com/v1/',
  },
} as const
