import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_ENDPOINT: {
    description: 'The HTTP URL to retrieve data from',
    type: 'string',
    default: 'https://min-api.cryptocompare.com',
  },
  WS_API_ENDPOINT: {
    description: 'The WS URL to retrieve data from',
    type: 'string',
    default: 'wss://data-streamer.cryptocompare.com',
  },
  API_KEY: {
    description: 'The CryptoCompare API key',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_KEY: {
    description: 'The websocket API key to authenticate with, if different from API_KEY',
    type: 'string',
    sensitive: true,
    default: '',
  },
  WS_ENABLED: {
    description: 'Whether data should be returned from websocket or not',
    type: 'boolean',
    default: true,
  },
})
