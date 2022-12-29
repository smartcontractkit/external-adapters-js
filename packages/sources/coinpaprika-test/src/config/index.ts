export const DEFAULT_API_ENDPOINT = 'https://api.coinpaprika.com'
export const PRO_API_ENDPOINT = 'https://api-pro.coinpaprika.com'

export const customSettings = {
  API_KEY: {
    description: 'An API key Coinpaprika',
    type: 'string',
    required: false,
  },
} as const
