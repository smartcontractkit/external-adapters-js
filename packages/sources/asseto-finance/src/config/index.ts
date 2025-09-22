import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  AUTH_API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://open.syncnav.com/api/oauth/token',
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://open.syncnav.com/api/funds',
  },
  CLIENT_ID: {
    description: 'Data Provider client ID',
    type: 'string',
    sensitive: true,
    default: 'chainlink',
  },
  CLIENT_SECRET: {
    description: 'Data Provider client secret',
    type: 'string',
    required: true,
    sensitive: true,
  },
  GRANT_TYPE: {
    description: 'Grant type for credentials',
    type: 'string',
    sensitive: true,
    default: 'client_credentials',
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
