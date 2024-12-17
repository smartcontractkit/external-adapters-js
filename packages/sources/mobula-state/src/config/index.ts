import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  WS_API_ENDPOINT: {
    description: 'WS endpoint for Data Provider',
    type: 'string',
    default: 'wss://production-feed.mobula.io',
  },
  API_KEY: {
    description: 'An API key for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
