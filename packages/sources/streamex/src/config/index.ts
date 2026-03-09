import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Streamex',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Streamex',
    type: 'string',
    default: 'https://data.streamex.com/prod/chainlink',
    sensitive: false,
  },
})
