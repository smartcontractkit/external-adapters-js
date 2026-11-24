import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The S&P SSA base URL',
    type: 'string',
    default: 'https://api.glb.prod.ratings.spglobal.com',
    sensitive: false,
  },
  AUTH_API_ENDPOINT: {
    description: 'The S&P OAuth token URL',
    type: 'string',
    default: 'https://secureapi.signin.spglobal.com',
    sensitive: false,
  },
  API_KEY: {
    description: 'API KEY for API_ENDPOINT',
    type: 'string',
    required: true,
    sensitive: true,
  },
  AUTH_API_KEY: {
    description: 'API KEY for AUTH_API_ENDPOINT',
    type: 'string',
    required: true,
    sensitive: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
    sensitive: false,
  },
})
