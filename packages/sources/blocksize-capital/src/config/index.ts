import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const defaultEndpoint = 'price'

export const config = new AdapterConfig({
  API_KEY: {
    description: 'The Blocksize Capital API key to use',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    description: 'The default WebSocket API base url',
    type: 'string',
    required: false,
    default: 'wss://data.blocksize.capital/marketdata/v1/ws',
    sensitive: false,
  },
  WS_NUM_SHARDS: {
    description:
      'Number of WebSocket connections to shard subscriptions across (each WS endpoint). Useful when the provider has a per-connection subscription cap. Default 1 = single connection (no sharding).',
    type: 'number',
    required: false,
    default: 1,
    sensitive: false,
  },
})
