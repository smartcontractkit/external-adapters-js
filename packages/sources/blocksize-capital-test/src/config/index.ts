export const customSettings = {
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
