import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'An API key for Data Provider',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    description: 'WS endpoint for Data Provider',
    type: 'string',
    default: 'wss://data.lo.tech/ws/v1/rwa-jp',
    sensitive: false,
  },
})
