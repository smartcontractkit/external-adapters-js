import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const DEFAULT_API_ENDPOINT = 'https://api.coingecko.com/api/v3'
export const PRO_API_ENDPOINT = 'https://pro-api.coingecko.com/api/v3'

export const defaultEndpoint = 'crypto'

export const customSettings = {
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    required: false,
  },
  API_KEY: {
    description: 'Optional Coingecko API key',
    type: 'string',
    required: false,
    sensitive: true,
  },
} as const

export const getApiEndpoint = (config: AdapterConfig<typeof customSettings>): string =>
  config.API_ENDPOINT || (config.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT)
