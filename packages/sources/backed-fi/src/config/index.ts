import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for Backed-Fi',
    type: 'string',
    default: 'https://api.backed.fi/api/v1/token',
  },
})
