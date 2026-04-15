import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Coinpaprika',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Coinpaprika',
    type: 'string',
    default: 'https://chainlink-streaming.dexpaprika.com',
    sensitive: false,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 3_000,
    sensitive: false,
  },
  REQUEST_TIMEOUT_MS: {
    description: 'Timeout for HTTP requests to the provider in milliseconds',
    type: 'number',
    default: 60_000,
    sensitive: false,
  },
})
