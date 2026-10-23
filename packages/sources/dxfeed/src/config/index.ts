import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('Config')

export const config = new AdapterConfig(
  {
    API_USERNAME: {
      description: 'username for dxfeed API; sent as the Basic auth header on the WS handshake',
      type: 'string',
      required: false,
      sensitive: false,
    },
    API_PASSWORD: {
      description: 'password for dxfeed API; sent as the Basic auth header on the WS handshake',
      type: 'string',
      required: false,
      sensitive: true,
    },
    WS_API_ENDPOINT: {
      description:
        'The dxLink websocket url for dxfeed. Clean URL only: credentials are sent as the Basic auth header, never in the URL.',
      type: 'string',
      required: false,
      sensitive: true,
    },
    API_ENDPOINT: {
      description: 'The API url for dxfeed',
      type: 'string',
      default: 'https://tools.dxfeed.com/webservice/rest',
      validate: {
        meta: {
          details: 'API endpoint warning',
        },
        fn: (value?: string): string => {
          if (value === 'https://tools.dxfeed.com/webservice/rest') {
            logger.warn(
              `Using demo endpoint: https://tools.dxfeed.com/webservice/rest (Please do not use in production!)`,
            )
          }
          return ''
        },
      },
      sensitive: false,
    },
  },
  {
    envDefaultOverrides: {
      WS_HEARTBEAT_INTERVAL_MS: 30_000,
    },
  },
)
