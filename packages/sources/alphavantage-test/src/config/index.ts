export const DEFAULT_API_ENDPOINT = 'forex'
export const customSettings = {
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: 'https://www.alphavantage.co/query',
    required: true,
  },
  API_KEY: {
    description:
      'An API key that can be obtained from [here](https://www.alphavantage.co/support/#api-key)',
    type: 'string',
    required: true,
    sensitive: true,
  },
} as const
