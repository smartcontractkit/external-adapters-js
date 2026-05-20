import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    REGION_API_KEY: {
      description: 'Lo-Tech API key for the given ${REGION}. Region can be "US" or "ASIA"',
      type: 'string',
      required: true,
      variablePlaceholder: 'REGION',
      sensitive: true,
    },
    REGION_WS_API_ENDPOINT: {
      description:
        'Lo-Tech websocket endpoint for the given ${REGION}. Region can be "US" or "ASIA"',
      type: 'string',
      required: true,
      variablePlaceholder: 'REGION',
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      WS_HEARTBEAT_INTERVAL_MS: 30_000,
    },
  },
)
