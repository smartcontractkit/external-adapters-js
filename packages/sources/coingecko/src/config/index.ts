import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const DEFAULT_API_ENDPOINT = 'https://api.coingecko.com/api/v3'
export const PRO_API_ENDPOINT = 'https://pro-api.coingecko.com/api/v3'

export const defaultEndpoint = 'crypto'

export const config = new AdapterConfig({
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
})

export const getApiEndpoint = (settings: typeof config.settings): string =>
  settings.API_ENDPOINT || (settings.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT)
