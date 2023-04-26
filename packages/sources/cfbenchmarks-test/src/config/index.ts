import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_USERNAME: {
    description: 'Username for the CFBenchmarks API',
    type: 'string',
    required: true,
  },
  API_PASSWORD: {
    description: 'Password for the CFBenchmarks API',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'The default REST API base url',
    type: 'string',
    required: false,
    default: 'https://www.cfbenchmarks.com/api',
  },
  WS_API_ENDPOINT: {
    description: 'The default WebSocket API base url',
    type: 'string',
    required: false,
    default: 'wss://www.cfbenchmarks.com/ws/v4',
  },
  API_SECONDARY: {
    description: 'Toggle using the secondary API base URLs',
    type: 'boolean',
    required: false,
    default: false,
  },
  SECONDARY_API_ENDPOINT: {
    description: 'The secondary REST API base url that is toggled using API_SECONDARY',
    type: 'string',
    required: false,
    default: 'https://unregprod.cfbenchmarks.com/api',
  },
  SECONDARY_WS_API_ENDPOINT: {
    description: 'The secondary WebSocket API base url that is toggled using API_SECONDARY',
    type: 'string',
    required: false,
    default: 'wss://unregprod.cfbenchmarks.com/ws/v4',
  },
  BIRC_RETRY: {
    description: 'How many times to retry if the BIRC API request fails',
    type: 'number',
    required: false,
    default: 3,
  },
  BIRC_RETRY_DELAY_MS: {
    description: 'How many miliseconds to wait between BIRC API request retries',
    type: 'number',
    required: false,
    default: 1000,
  },
})
