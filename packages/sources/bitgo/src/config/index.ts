import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'API key for Bitgo',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'API endpoint for Bitgo',
    type: 'string',
    required: true,
  },
  API_LIMIT: {
    description: 'The default maximum number of results to request from the API',
    type: 'number',
    default: 100,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
