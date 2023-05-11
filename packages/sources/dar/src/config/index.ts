import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig(
  {
    API_ENDPOINT: {
      description: 'Base URL for DAR REST endpoints',
      type: 'string',
      required: false,
      default: 'https://api-beta.digitalassetresearch.com/v2',
    },
    WS_API_ENDPOINT: {
      description: 'WS URL for the DAR API',
      type: 'string',
      required: false,
      default: 'wss://dar-ws-400ms.digitalassetresearch.com',
    },
    WS_API_KEY: {
      description: 'Key for the DAR API',
      type: 'string',
      required: true,
      sensitive: true,
    },
    WS_API_USERNAME: {
      description: 'Username for the DAR API',
      type: 'string',
      required: true,
      sensitive: true,
    },
  },
  {
    envDefaultOverrides: {
      CACHE_MAX_AGE: 20 * 60 * 1000, //20 minutes
    },
  },
)

//export const WS_HEARTBEAT_MS = 60000
