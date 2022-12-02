export const customSettings = {
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
    default: 'wss://6xfpgjrsh4.execute-api.us-east-1.amazonaws.com/production',
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
} as const

export const WS_HEARTBEAT_MS = 60000
