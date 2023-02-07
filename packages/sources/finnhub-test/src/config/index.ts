export const DEFAULT_API_ENDPOINT = 'quote'
export const customSettings = {
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: 'https://finnhub.io/api/v1',
    required: true,
  },
  API_KEY: {
    description: 'A Finnhub API key ',
    type: 'string',
    required: true,
    sensitive: true,
  },
} as const
