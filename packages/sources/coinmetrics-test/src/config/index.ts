export const DEFAULT_API_ENDPOINT = 'https://api.coinmetrics.io/v4'

export const customSettings = {
  API_KEY: {
    description: 'The coinmetrics API key',
    type: 'string',
    required: true,
    sensitive: true,
  },
} as const
