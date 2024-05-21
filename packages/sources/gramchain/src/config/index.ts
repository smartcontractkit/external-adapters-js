import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for gramchain',
    type: 'string',
    default: 'https://api-prod.gramchain.net/api/public',
  },
})
