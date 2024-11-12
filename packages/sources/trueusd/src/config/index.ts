import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'API endpoint of adapter',
    type: 'string',
    default: 'https://api.real-time-reserves.ledgerlens.io/v1/',
  },
})
