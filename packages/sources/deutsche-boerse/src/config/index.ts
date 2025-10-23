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
    default: 'wss://md.deutsche-boerse.com',
  },
  HEARTBEAT_INTERVAL_MS: {
    description: 'Interval in milliseconds to send WebSocket ping frames to keep connection alive',
    default: 30000,
    type: 'number',
  },
  CACHE_TTL_REFRESH_MS: {
    description: 'Interval to refresh the TTL of active subscriptions',
    default: 60000,
    type: 'number',
  },
})
