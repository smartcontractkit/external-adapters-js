import { getEnv, parseBool } from '../util'
import { WSConfig } from './types'

const ENV_WS_ENABLED = 'WS_ENABLED'

// WSConnectionInfo
const ENV_WS_CONNECTION_KEY = 'WS_CONNECTION_KEY'

// WSConfig
const ENV_WS_CONNECTION_LIMIT = 'WS_CONNECTION_LIMIT'
const ENV_WS_CONNECTION_TTL = 'WS_CONNECTION_TTL'
const ENV_WS_CONNECTION_RETRY_LIMIT = 'WS_CONNECTION_RETRY_LIMIT'
const ENV_WS_CONNECTION_RETRY_DELAY = 'WS_CONNECTION_RETRY_DELAY'
const ENV_WS_SUBSCRIPTION_LIMIT = 'WS_SUBSCRIPTION_LIMIT'
const ENV_WS_SUBSCRIPTION_TTL = 'WS_SUBSCRIPTION_TTL'
const ENV_WS_SUBSCRIPTION_UNRESPONSIVE_TTL = 'WS_SUBSCRIPTION_UNRESPONSIVE_TTL'
const ENV_WS_SUBSCRIPTION_PRIORITY_LIST = 'WS_SUBSCRIPTION_PRIORITY_LIST'

// WSConfig defaults
const DEFAULT_WS_CONNECTION_LIMIT = 1
const DEFAULT_WS_CONNECTION_TTL = 70000
const DEFAULT_WS_CONNECTION_RETRY_LIMIT = 3
const DEFAULT_WS_CONNECTION_RETRY_DELAY = 1000
const DEFAULT_WS_SUBSCRIPTION_LIMIT = 10
const DEFAULT_WS_SUBSCRIPTION_TTL = 120000
const DEFAULT_WS_SUBSCRIPTION_UNRESPONSIVE_TTL = 120000

/** Load WSConfig from environment variables */
export const getWSConfig = (): WSConfig => ({
  enabled: parseBool(getEnv(ENV_WS_ENABLED)),
  connectionInfo: {
    key: getEnv(ENV_WS_CONNECTION_KEY) || '1',
  },
  connectionLimit: Number(getEnv(ENV_WS_CONNECTION_LIMIT)) || DEFAULT_WS_CONNECTION_LIMIT,
  connectionTTL: Number(getEnv(ENV_WS_CONNECTION_TTL)) || DEFAULT_WS_CONNECTION_TTL,
  connectionRetryLimit:
    Number(getEnv(ENV_WS_CONNECTION_RETRY_LIMIT)) || DEFAULT_WS_CONNECTION_RETRY_LIMIT,
  connectionRetryDelay:
    Number(getEnv(ENV_WS_CONNECTION_RETRY_DELAY)) || DEFAULT_WS_CONNECTION_RETRY_DELAY,
  subscriptionLimit: Number(getEnv(ENV_WS_SUBSCRIPTION_LIMIT)) || DEFAULT_WS_SUBSCRIPTION_LIMIT,
  subscriptionTTL: Number(getEnv(ENV_WS_SUBSCRIPTION_TTL)) || DEFAULT_WS_SUBSCRIPTION_TTL,
  subscriptionUnresponsiveTTL:
    Number(getEnv(ENV_WS_SUBSCRIPTION_UNRESPONSIVE_TTL)) ||
    DEFAULT_WS_SUBSCRIPTION_UNRESPONSIVE_TTL,
  subscriptionPriorityList: (getEnv(ENV_WS_SUBSCRIPTION_PRIORITY_LIST) || []) as Array<string>, // TODO: load array
})

export const wsRedactPaths = [
  'payload.wsHandler.connection.protocol.query.api_key',
  'payload.connectionInfo.url',
  'payload.wsHandler.connection.url',
]
