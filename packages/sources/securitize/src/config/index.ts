import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Securitize NAV',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'The API endpoint for Securitize NAV',
    type: 'string',
    default: 'https://partners-api.securitize.io/asset-metrics/api/v1/nav',
  },
})
