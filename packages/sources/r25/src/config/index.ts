import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for R25',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_SECRET: {
    description: 'An API secret for R25 used to sign requests',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for R25',
    type: 'string',
    default: 'https://app.r25.xyz',
    sensitive: false,
  },
})
