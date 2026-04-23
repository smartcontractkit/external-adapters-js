import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_KEY: {
      description: `The API key for the data provider API`,
      type: 'string',
      required: true,
      sensitive: true,
    },
    API_ENDPOINT: {
      description: 'An API endpoint for Data Provider',
      type: 'string',
      default: 'https://api.itick.org',
      sensitive: false,
    },
    WS_API_ENDPOINT: {
      description: 'WS endpoint for Data Provider',
      type: 'string',
      default: 'wss://api.itick.org',
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      WS_HEARTBEAT_INTERVAL_MS: 30_000,
    },
  },
)
