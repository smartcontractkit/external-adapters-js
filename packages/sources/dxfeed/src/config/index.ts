import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('Config')

const WS_ENDPOINT_CHECKS: ((url: URL) => string)[] = [
  (url) =>
    url.username || url.password
      ? 'WS_API_ENDPOINT must not contain credentials, use API_USERNAME and API_PASSWORD instead'
      : '',
  (url) =>
    url.pathname.includes('chainlink/cometd')
      ? 'WS_API_ENDPOINT must be the dxLink endpoint, not the legacy cometd path'
      : '',
]

const validateWsEndpoint = (value?: string): string => {
  if (!value) {
    return ''
  }
  try {
    const url = new URL(value)
    return WS_ENDPOINT_CHECKS.map((check) => check(url)).find(Boolean) ?? ''
  } catch {
    return ''
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
          details: 'Must be the dxLink endpoint and must not contain credentials',
        },
        fn: validateWsEndpoint,
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
