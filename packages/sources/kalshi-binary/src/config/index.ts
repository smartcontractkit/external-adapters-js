import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'API endpoint for Kalshi',
    type: 'string',
    default: 'https://api.kalshi.com/v1',
  },
  KALSHI_API_KEY: {
    description: 'Kalshi API key for authentication',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
