import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('Config')

const hasEmbeddedCredentials = (url: string): boolean => {
  try {
    const { username, password } = new URL(url)
    return Boolean(username || password)
  } catch {
    return false
  }
}

export const config = new AdapterConfig(
  {
    API_USERNAME: {
      description: 'username for dxfeed API',
      type: 'string',
      sensitive: false,
    },
    API_PASSWORD: {
      description: 'password for dxfeed API',
      type: 'string',
      sensitive: true,
    },
    WS_API_ENDPOINT: {
      description:
        'The dxLink websocket url for dxfeed. Credentials are taken from API_USERNAME and API_PASSWORD, not the url',
      type: 'string',
      sensitive: true,
      validate: {
        meta: {
          details: 'Must not contain credentials',
        },
        fn: (value?: string): string =>
          value && hasEmbeddedCredentials(value)
            ? 'WS_API_ENDPOINT must not contain credentials, use API_USERNAME and API_PASSWORD instead'
            : '',
      },
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
