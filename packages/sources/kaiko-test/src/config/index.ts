export const customSettings = {
  API_KEY: {
    description: 'API KEY for  KAIKO',
    type: 'string',
    required: true,
  },
  API_ENDPOINT: {
    description: 'API endpoint for  KAIKO',
    type: 'string',
    default: 'https://us.market-api.kaiko.io/v2/data/trades.v1',
  },
} as const
