import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://dataspanapi.wisdomtree.com',
    sensitive: false,
  },
  API_KEY: {
    description: 'WisdomTree API key value',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
