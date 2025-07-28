import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The API endpoint for Ondo',
    type: 'string',
    default: 'https://api.gm.ondo.finance/',
  },
  API_KEY: {
    description: 'An API key required to access the API_ENDPOINT',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
