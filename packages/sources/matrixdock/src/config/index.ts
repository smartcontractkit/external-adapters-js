import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Matrixdock',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_SECRET: {
    description: 'An API secret for Matrixdock used to sign requests',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Matrixdock',
    type: 'string',
    default: 'https://mapi.matrixport.com',
    sensitive: false,
  },
})
