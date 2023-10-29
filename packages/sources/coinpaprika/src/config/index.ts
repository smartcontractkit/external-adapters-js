import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const DEFAULT_API_ENDPOINT = 'https://api.coinpaprika.com'
export const PRO_API_ENDPOINT = 'https://api-pro.coinpaprika.com'

export const config = new AdapterConfig({
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
  WS_API_ENDPOINT: {
    description: 'The WS API endpoint for Coinpaprika',
    default: 'wss://streaming.coinpaprika.com/ticks',
    type: 'string',
  },
})

export const getApiEndpoint = (settings: typeof config.settings): string =>
  settings.API_ENDPOINT || (settings.API_KEY ? PRO_API_ENDPOINT : DEFAULT_API_ENDPOINT)

export const getApiHeaders = (settings: typeof config.settings): { Authorization?: string } => {
  const headers: { Authorization?: string } = {}
  if (settings.API_KEY) {
    headers['Authorization'] = settings.API_KEY
  }
  return headers
}
