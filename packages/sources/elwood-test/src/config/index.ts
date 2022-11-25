export const customSettings = {
  API_KEY: {
    description: 'API key',
    type: 'string',
    required: true,
  },
  WS_API_ENDPOINT: {
    description: 'The websocket url for coinmetrics',
    type: 'string',
    default: 'wss://api.chk.elwood.systems/v1/stream',
  },
  API_ENDPOINT: {
    description: 'The API url for coinmetrics',
    type: 'string',
    default: 'https://api.chk.elwood.systems/v1/stream',
  },
} as const
