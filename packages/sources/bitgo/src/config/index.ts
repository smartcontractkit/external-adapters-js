import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Bitgo',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Bitgo',
    type: 'string',
    required: true,
  },
  API_LIMIT: {
    description: 'The maximum number of results to request from the API',
    type: 'number',
    default: 100,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 40_000,
  },
})
