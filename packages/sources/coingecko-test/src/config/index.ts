import { SettingsMap } from '@chainlink/external-adapter-framework/config'

export const NAME = 'COINGECKO'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_API_ENDPOINT = 'https://api.coingecko.com/api/v3'
export const PRO_API_ENDPOINT = 'https://pro-api.coingecko.com/api/v3'

export const customSettings: SettingsMap = {
  API_KEY: {
    description: 'API key for the CoinGecko API',
    type: 'string',
  },
} as const
