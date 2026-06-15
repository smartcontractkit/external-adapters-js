import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_KEY: {
      description: 'An API key for Data Provider',
      type: 'string',
      required: true,
      sensitive: true,
    },
    WS_API_ENDPOINT: {
      description: 'WS endpoint for Data Provider',
      type: 'string',
      default: 'wss://ws.price.usenobi.com/v2',
      sensitive: false,
    },
    MAX_SUBSCRIPTIONS_PER_TRANSPORT: {
      description:
        'The maximum number of currency pairs to route through a single transport before routing to the next one',
      type: 'number',
      default: 100,
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      WS_HEARTBEAT_INTERVAL_MS: 10_000,
    },
  },
)
