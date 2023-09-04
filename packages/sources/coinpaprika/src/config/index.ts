import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: 'https://api-pro.coinpaprika.com',
  },
  API_KEY: {
    description: 'An API key for Coinpaprika',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
