import { getEnv, parseBool } from '../util'
import { WSConfig, WSConnectionInfo } from './types'

const ENV_WS_ENABLED = 'EXPERIMENTAL_WS_ENABLED'

// WSConnectionInfo
const ENV_WS_CONNECTION_KEY = 'WS_CONNECTION_KEY'
const ENV_WS_CONNECTION_URL = 'WS_CONNECTION_URL'
const ENV_WS_CONNECTION_PROTOCOL = 'WS_CONNECTION_PROTOCOL'

// WSConfig
const ENV_WS_CONNECTION_LIMIT = 'WS_CONNECTION_LIMIT'
const ENV_WS_CONNECTION_TTL = 'WS_CONNECTION_TTL'
const ENV_WS_CONNECTION_RETRY_LIMIT = 'WS_CONNECTION_RETRY_LIMIT'
const ENV_WS_CONNECTION_RETRY_DELAY = 'WS_CONNECTION_RETRY_DELAY'
const ENV_WS_SUBSCRIPTION_LIMIT = 'WS_SUBSCRIPTION_LIMIT'
const ENV_WS_SUBSCRIPTION_TTL = 'WS_SUBSCRIPTION_TTL'
const ENV_WS_SUBSCRIPTION_PRIORITY_LIST = 'WS_SUBSCRIPTION_PRIORITY_LIST'

// WSConfig defaults
const DEFAULT_WS_CONNECTION_LIMIT = 1
const DEFAULT_WS_CONNECTION_TTL = 70000
const DEFAULT_WS_CONNECTION_RETRY_LIMIT = 3
const DEFAULT_WS_CONNECTION_RETRY_DELAY = 1000
const DEFAULT_WS_SUBSCRIPTION_LIMIT = 10
const DEFAULT_WS_SUBSCRIPTION_TTL = 70000

export const WS_ENABLED = parseBool(getEnv(ENV_WS_ENABLED))

/** Load WSConnectionInfo from environment variables */
export const envLoad_WSConnectionInfo = (prefix = ''): WSConnectionInfo => {
  const url = getEnv(ENV_WS_CONNECTION_URL, prefix) || '' // TODO: Some adapters don't support WS. Moved URL into defaultConfig
  const protocol = getEnv(ENV_WS_CONNECTION_PROTOCOL, prefix) // TODO: load array
  const key = getEnv(ENV_WS_CONNECTION_KEY, prefix) || '1' // TODO: generate key
  return { key, url, protocol }
}

/** Load WSConfig from environment variables */
export const envLoad_WSConfig = (prefix = ''): WSConfig => ({
  connectionInfo: envLoad_WSConnectionInfo(prefix),
  connectionLimit: Number(getEnv(ENV_WS_CONNECTION_LIMIT, prefix)) || DEFAULT_WS_CONNECTION_LIMIT,
  connectionTTL: Number(getEnv(ENV_WS_CONNECTION_TTL, prefix)) || DEFAULT_WS_CONNECTION_TTL,
  connectionRetryLimit:
    Number(getEnv(ENV_WS_CONNECTION_RETRY_LIMIT, prefix)) || DEFAULT_WS_CONNECTION_RETRY_LIMIT,
  connectionRetryDelay:
    Number(getEnv(ENV_WS_CONNECTION_RETRY_DELAY, prefix)) || DEFAULT_WS_CONNECTION_RETRY_DELAY,
  subscriptionLimit:
    Number(getEnv(ENV_WS_SUBSCRIPTION_LIMIT, prefix)) || DEFAULT_WS_SUBSCRIPTION_LIMIT,
  subscriptionTTL: Number(getEnv(ENV_WS_SUBSCRIPTION_TTL, prefix)) || DEFAULT_WS_SUBSCRIPTION_TTL,
  subscriptionPriorityList: (getEnv(ENV_WS_SUBSCRIPTION_PRIORITY_LIST) || []) as Array<string>, // TODO: load array
})
