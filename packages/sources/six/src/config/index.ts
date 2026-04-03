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
    CERT_BASE64: {
      description:
        'Base64-encoded signed certificate (signed-certificate.pem) for mTLS authentication',
      type: 'string',
      required: true,
      sensitive: true,
    },
    KEY_BASE64: {
      description: 'Base64-encoded private key (private-key.pem) for mTLS authentication',
      type: 'string',
      required: true,
      sensitive: true,
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
      // SIX requires ping every 10s, disconnects after 60s inactivity.
      // Detect zombie connections faster than the default 120s.
      WS_SUBSCRIPTION_UNRESPONSIVE_TTL: 30_000, // 30s without data -> reconnect
      CACHE_MAX_AGE: 10_000, // 10s - data updates every 1s, stale after 10s
    },
  },
)
