export const defaultEndpoint = 'price'

export const customSettings = {
  API_KEY: {
    description: 'The Blocksize Capital API key',
    type: 'string',
    required: true,
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    description: 'The default WebSocket API base url',
    type: 'string',
    required: false,
    default: 'wss://data.blocksize.capital/marketdata/v1/ws',
  },
  WS_ENABLED: {
    description: 'Toggle to set the default endpoint to use WebSockets',
    type: 'boolean',
    required: false,
    default: true,
    validate: (value?: boolean) => {
      if (!value) {
        return 'WS_ENABLED must be set to true. Non-WS endpoints are not supported yet.'
      } else {
        return
      }
    },
  },
} as const
