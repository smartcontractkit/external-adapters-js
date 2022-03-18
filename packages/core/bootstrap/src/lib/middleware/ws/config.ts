import { AdapterContext } from '@chainlink/types'
import { getEnv, parseBool } from '../../util'
import { WSConfig } from './types'

/** Load WSConfig from environment variables */
export const getWSConfig = (endpoint?: string, context?: AdapterContext): WSConfig => ({
  enabled: parseBool(getEnv('WS_ENABLED', undefined, context)),

  connectionInfo: {
    key: `${getEnv('WS_CONNECTION_KEY')}-${endpoint}`,
  },
  connectionLimit: Number(getEnv('WS_CONNECTION_LIMIT')),
  connectionTTL: Number(getEnv('WS_CONNECTION_TTL')),
  connectionRetryLimit: Number(getEnv('WS_CONNECTION_RETRY_LIMIT')),
  connectionRetryDelay: Number(getEnv('WS_CONNECTION_RETRY_DELAY')),
  subscriptionLimit: Number(getEnv('WS_SUBSCRIPTION_LIMIT')),
  subscriptionTTL: Number(getEnv('WS_SUBSCRIPTION_TTL')),
  subscriptionUnresponsiveTTL: Number(getEnv('WS_SUBSCRIPTION_UNRESPONSIVE_TTL')),
  subscriptionPriorityList: (getEnv('WS_SUBSCRIPTION_PRIORITY_LIST') || []) as Array<string>, // TODO: load array,
  defaultHeartbeatIntervalInMS: Number(getEnv('DEFAULT_WS_HEARTBEAT_INTERVAL')),
})

export const wsRedactPaths = [
  'payload.wsHandler.connection.protocol.query.api_key',
  'payload.connectionInfo.url',
  'payload.wsHandler.connection.url',
]
