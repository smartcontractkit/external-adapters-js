import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  CLIENT_ID: {
    description: 'Data Provider client ID',
    type: 'string',
    required: true,
    sensitive: true,
  },
  CLIENT_SECRET: {
    description: 'Data Provider client secret',
    type: 'string',
    required: true,
    sensitive: true,
  },
  SCOPE: {
    description: 'Scope of credentials',
    type: 'string',
    required: true,
    sensitive: true,
  },
  GRANT_TYPE: {
    description: 'Grant type for credentials',
    type: 'string',
    required: true,
    sensitive: true,
  },
  NAV_API_ENDPOINT: {
    description: 'An API endpoint for Data Provider',
    type: 'string',
    default: 'https://api.apexgroup.com/v1/reports/NAV',
  },
  AUTH_API_ENDPOINT: {
    description: 'An auth API endpoint for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
