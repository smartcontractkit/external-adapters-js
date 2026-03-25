import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    ...Object.fromEntries(
      ['hk', 'cn', 'gb', 'kr', 'jp', 'tw'].map((region) => [
        `API_KEY_${region.toUpperCase()}`,
        {
          description: `The API key for region '${region.toUpperCase()}'`,
          type: 'string',
        },
      ]),
    ),
    API_ENDPOINT: {
      description: 'An API endpoint for Data Provider',
      type: 'string',
      default: 'https://api.itick.org',
    },
    WS_API_ENDPOINT: {
      description: 'WS endpoint for Data Provider',
      type: 'string',
      default: 'wss://api.itick.org',
    },
  },
  {
    envDefaultOverrides: {
      WS_HEARTBEAT_INTERVAL_MS: 30_000,
    },
  },
)
