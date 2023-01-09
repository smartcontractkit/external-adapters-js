import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const DEFAULT_API_ENDPOINT = 'https://api.coinpaprika.com'
export const PRO_API_ENDPOINT = 'https://api-pro.coinpaprika.com'

export const customSettings = {
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    required: false,
  },
  API_KEY: {
    description: 'An API key for Coinpaprika',
    type: 'string',
    required: false,
    sensitive: true,
  },
} as const

export const getApiEndpoint = (config: AdapterConfig<typeof customSettings>): string =>
  config.API_ENDPOINT || (config.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT)

export const getApiHeaders = (
  config: AdapterConfig<typeof customSettings>,
): { Authorization?: string } => {
  const headers: { Authorization?: string } = {}
  if (config.API_KEY) {
    headers['Authorization'] = config.API_KEY
  }
  return headers
}
