import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_KEY_HK: {
      description: `The API key for region 'hk'`,
      type: 'string',
    },
    API_KEY_CN: {
      description: `The API key for region 'cn'`,
      type: 'string',
    },
    API_KEY_GB: {
      description: `The API key for region 'gb'`,
      type: 'string',
    },
    API_KEY_KR: {
      description: `The API key for region 'kr'`,
      type: 'string',
    },
    API_KEY_JP: {
      description: `The API key for region 'jp'`,
      type: 'string',
    },
    API_KEY_TW: {
      description: `The API key for region 'tw'`,
      type: 'string',
    },
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
