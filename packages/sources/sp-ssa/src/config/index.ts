import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The S&P SSA base URL for the environment',
    type: 'string',
    required: true,
    sensitive: false,
  },
  TOKEN_ENDPOINT: {
    description: 'The S&P OAuth token URL for the environment',
    type: 'string',
    required: true,
    sensitive: false,
  },
  CLIENT_ID: {
    description: 'The S&P OAuth client id',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_KEY: {
    description: 'The S&P apikey sent on SSA data requests',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
