import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  SECRET_KEY: {
    description: 'A key for Data Provider used in hashing the API key',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://api.navfundservices.com',
  },
  MAX_RETRIES: {
    description: 'Maximum attempts of sending a request',
    type: 'number',
    default: 3,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 120_000, // one call per two minute
  },
})
