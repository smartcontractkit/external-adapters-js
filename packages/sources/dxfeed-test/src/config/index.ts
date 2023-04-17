import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('Config')

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
        logger.warn(
          `Using demo endpoint: https://tools.dxfeed.com/webservice/rest (Please do not use in production!)`,
        )
      }
      return ''
    },
  },
})
