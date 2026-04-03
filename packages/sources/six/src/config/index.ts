import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    WS_API_ENDPOINT: {
      description: 'SIX WebSocket API endpoint',
      type: 'string',
      default: 'wss://api.six-group.com/web/v2/websocket',
      required: true,
      sensitive: false,
    },
    CONFLATION_PERIOD: {
      description: 'Conflation period in ISO 8601 duration format (e.g. PT1S for 1 second)',
      type: 'string',
      default: 'PT1S',
      required: false,
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 10_000, // 10s - data updates every 1s, stale after 10s
    },
  },
)
