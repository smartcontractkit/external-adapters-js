export const DEFAULT_INTERVAL = '1m'
export const DEFAULT_SORT = 'desc'
export const DEFAULT_MILLISECONDS = 1800000
export const DEFAULT_ENDPOINT = 'trades'
export const DEFAULT_API_ENDPOINT = 'https://us.market-api.kaiko.io/v2/data/trades.v1'

export const customSettings = {
  API_KEY: {
    description: 'API KEY for  KAIKO',
    type: 'string',
    required: true,
  },
} as const
