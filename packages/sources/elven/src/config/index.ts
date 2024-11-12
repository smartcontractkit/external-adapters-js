import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'API Endpoint for Elven',
    default: 'https://por.elven.com',
    type: 'string',
  },
  API_KEY: {
    description: 'API Key for Elven',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_SECRET: {
    description: 'API Secret for Elven',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
