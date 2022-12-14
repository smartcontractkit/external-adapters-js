export const customSettings = {
  API_USERNAME: {
    description: 'username for dxfeed API',
    type: 'string',
    default: '',
  },
  API_PASSWORD: {
    description: 'password for dxfeed API',
    type: 'string',
    sensitive: true,
    default: '',
  },
  WS_API_ENDPOINT: {
    description: 'The websocket url for dxfeed',
    type: 'string',
    default: '',
  },
  WS_ENABLED: {
    description: 'Whether data should be returned from websocket or not',
    type: 'boolean',
    default: false,
  },
  API_ENDPOINT: {
    description: 'The API url for dxfeed',
    type: 'string',
    default: 'https://tools.dxfeed.com/webservice/rest',
    validate: (value?: string): string => {
      if (value === 'https://tools.dxfeed.com/webservice/rest') {
        console.warn(
          `Using demo endpoint: https://tools.dxfeed.com/webservice/rest (Please do not use in production!)`,
        )
      }
      return ''
    },
  },
} as const
