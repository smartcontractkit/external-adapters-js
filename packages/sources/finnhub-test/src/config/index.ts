import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: 'https://finnhub.io/api/v1',
  },
  API_KEY: {
    description: 'A Finnhub API key ',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
