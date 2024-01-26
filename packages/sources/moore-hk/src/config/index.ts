import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'An API endpoint for the Data Provider',
    type: 'string',
    default: 'https://api.real-time-reserves.verinumus.io/v1/',
  },
})
