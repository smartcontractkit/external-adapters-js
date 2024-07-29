import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'Base URL for the TradingHours API',
    type: 'string',
    default: 'https://api.tradinghours.com',
  },
  API_KEY: {
    description: 'API key for the TradingHours API',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
