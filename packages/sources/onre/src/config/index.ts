import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for OnRe',
    type: 'string',
    default: 'https://onre-api-prod.ew.r.appspot.com',
  },
})
