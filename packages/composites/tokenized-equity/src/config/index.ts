import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { StreamMaxAgeSeconds } from '../lib/streams'

export const settingsDefinition = {
  DATA_ENGINE_ADAPTER_URL: {
    description: 'URL of data engine ea',
    type: 'string',
    required: true,
    sensitive: false,
  },
  TRADING_HOURS_ADAPTER_URL: {
    description: 'URL of tradinghours ea',
    type: 'string',
    required: true,
    sensitive: false,
  },
  ETHEREUM_RPC_URL: {
    description: 'RPC URL of a Mainnet ETH node',
    type: 'string',
    default: '',
    sensitive: true,
  },
  ETHEREUM_RPC_CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    default: 1,
    sensitive: false,
  },
  BASE_RPC_URL: {
    description: 'RPC URL of a Mainnet Base node',
    type: 'string',
    default: '',
    sensitive: true,
  },
  BASE_RPC_CHAIN_ID: {
    description: 'The chain id to connect to',
    type: 'number',
    default: 8453,
    sensitive: false,
  },
  ROBINHOOD_NETWORK_RPC_URL: {
    description:
      'JSON RPC URL for robinhood endpoint. ${NETWORK} should be "mainnet" or "testnet".',
    type: 'string',
    required: true,
    variablePlaceholder: 'NETWORK',
    sensitive: true,
  },
  ROBINHOOD_NETWORK_CHAIN_ID: {
    description: 'Chain ID for the Robinhood chain. ${NETWORK} should be "mainnet" or "testnet".',
    type: 'number',
    required: true,
    variablePlaceholder: 'NETWORK',
  },

  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 1_000,
    sensitive: false,
  },

  DS_VALID_MAX_AGE_SECONDS: {
    description:
      'Consumer-side staleness check: reject a selected data-engine report whose age (now - lastSeenTimestampNs) exceeds this many seconds. Shared default for all session streams; unset or 0 disables the check.',
    type: 'number',
    sensitive: false,
  },
  DS_VALID_MAX_AGE_SECONDS_REGULAR: {
    description: 'Per-session override of DS_VALID_MAX_AGE_SECONDS for the regular-hours stream.',
    type: 'number',
    sensitive: false,
  },
  DS_VALID_MAX_AGE_SECONDS_EXTENDED: {
    description:
      'Per-session override of DS_VALID_MAX_AGE_SECONDS for the extended-hours (pre/post-market) stream.',
    type: 'number',
    sensitive: false,
  },
  DS_VALID_MAX_AGE_SECONDS_OVERNIGHT: {
    description: 'Per-session override of DS_VALID_MAX_AGE_SECONDS for the overnight stream.',
    type: 'number',
    sensitive: false,
  },

  DS_SESSION_START_GATING_ENABLED: {
    description:
      'Pre-open warm-up check: discard a selected data-engine report whose lastSeenTimestampNs is before the start of the current session (per the tradinghours market-session schedule). Requires the session* request params. Fails closed (503) when the session start cannot be determined. Default false (disabled).',
    type: 'boolean',
    default: false,
    sensitive: false,
  },
} as const

export const config = new AdapterConfig(settingsDefinition)

type StreamMaxAgeSettings = {
  DS_VALID_MAX_AGE_SECONDS?: number
  DS_VALID_MAX_AGE_SECONDS_REGULAR?: number
  DS_VALID_MAX_AGE_SECONDS_EXTENDED?: number
  DS_VALID_MAX_AGE_SECONDS_OVERNIGHT?: number
}

// 0 or negative means "unset" (check disabled), so operators can explicitly
// neutralize a value inherited from a shared env layer.
const enabled = (v: number | undefined): number | undefined =>
  v !== undefined && v > 0 ? v : undefined

export const resolveStreamMaxAgeSeconds = (settings: StreamMaxAgeSettings): StreamMaxAgeSeconds => {
  const shared = enabled(settings.DS_VALID_MAX_AGE_SECONDS)
  return {
    regular: enabled(settings.DS_VALID_MAX_AGE_SECONDS_REGULAR) ?? shared,
    extended: enabled(settings.DS_VALID_MAX_AGE_SECONDS_EXTENDED) ?? shared,
    overnight: enabled(settings.DS_VALID_MAX_AGE_SECONDS_OVERNIGHT) ?? shared,
  }
}
