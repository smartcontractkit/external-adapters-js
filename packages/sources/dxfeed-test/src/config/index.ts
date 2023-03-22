import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  API_USERNAME: {
    description: 'username for dxfeed API',
    type: 'string',
  },
  API_PASSWORD: {
    description: 'password for dxfeed API',
    type: 'string',
    sensitive: true,
  },
  WS_API_ENDPOINT: {
    description: 'The websocket url for dxfeed',
    type: 'string',
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
})
