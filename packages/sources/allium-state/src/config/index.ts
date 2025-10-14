import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  WS_API_ENDPOINT: {
    description: 'The WebSocket endpoint for Allium state prices',
    type: 'string',
    default: 'wss://api.allium.so/api/v1/developer/state-prices/ws',
  },
  API_KEY: {
    description: 'API key for Allium',
    type: 'string',
    required: true,
    sensitive: true,
  },
})
