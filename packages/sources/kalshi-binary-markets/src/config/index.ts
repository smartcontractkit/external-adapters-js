import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'API key for Kalshi',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'API endpoint for Kalshi',
    type: 'string',
    default: 'https://api.kalshi.com/v1',
  },
})
