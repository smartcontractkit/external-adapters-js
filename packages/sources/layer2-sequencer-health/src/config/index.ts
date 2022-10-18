import { AdapterConfigError, Requester, util } from '@chainlink/ea-bootstrap'
import { AdapterContext, Config } from '@chainlink/ea-bootstrap'
import { envDefaultOverrides } from './envDefaultOverrides'
import { SequencerProvider } from 'starknet'

export const NAME = 'L2_SEQUENCER_HEALTH'
export const DEFAULT_PRIVATE_KEY =
  '0x0000000000000000000000000000000000000000000000000000000000000001'

export const adapterContext: AdapterContext = { name: NAME, envDefaultOverrides }

export const DEFAULT_ENDPOINT = 'health'

// 2 minutes
export const DEFAULT_DELTA_TIME = 2 * 60 * 1000
// Blocks that replica nodes can fall behind
export const DEFAULT_DELTA_BLOCKS = 6
// milliseconds to consider a timeout transaction (10 secs)
export const DEFAULT_TIMEOUT_LIMIT = 5 * 1000
// number of times to retry checking that blockchain is progressing
export const DEFAULT_NUM_RETRIES = 2
// number of milliseconds until next retry
export const DEFAULT_RETRY_INTERVAL = 5 * 100

export const ENV_ARBITRUM_RPC_ENDPOINT = 'ARBITRUM_RPC_ENDPOINT'
export const ENV_OPTIMISM_RPC_ENDPOINT = 'OPTIMISM_RPC_ENDPOINT'
export const ENV_METIS_RPC_ENDPOINT = 'METIS_RPC_ENDPOINT'

export const ENV_ARBITRUM_CHAIN_ID = 'ARBITRUM_CHAIN_ID'
export const ENV_OPTIMISM_CHAIN_ID = 'OPTIMISM_CHAIN_ID'
export const ENV_METIS_CHAIN_ID = 'METIS_CHAIN_ID'

export const DEFAULT_ARBITRUM_CHAIN_ID = '42161'
export const DEFAULT_OPTIMISM_CHAIN_ID = '10'
export const DEFAULT_METIS_CHAIN_ID = '1088'

export enum Networks {
  Arbitrum = 'arbitrum',
  Optimism = 'optimism',
  Metis = 'metis',
  Starkware = 'starkware',
}

export type EVMNetworks = Exclude<Networks, Networks.Starkware>

const DEFAULT_ARBITRUM_RPC_ENDPOINT = 'https://arb1.arbitrum.io/rpc'
const DEFAULT_OPTIMISM_RPC_ENDPOINT = 'https://mainnet.optimism.io'
const DEFAULT_METIS_RPC_ENDPOINT = 'https://andromeda.metis.io/?owner=1088'

export const RPC_ENDPOINTS: Record<EVMNetworks, string | undefined> = {
  [Networks.Arbitrum]: util.getEnv(ENV_ARBITRUM_RPC_ENDPOINT) || DEFAULT_ARBITRUM_RPC_ENDPOINT,
  [Networks.Optimism]: util.getEnv(ENV_OPTIMISM_RPC_ENDPOINT) || DEFAULT_OPTIMISM_RPC_ENDPOINT,
  [Networks.Metis]: util.getEnv(ENV_METIS_RPC_ENDPOINT) || DEFAULT_METIS_RPC_ENDPOINT,
}

export const CHAIN_IDS = {
  [Networks.Arbitrum]:
    parseInt(util.getEnv(ENV_ARBITRUM_CHAIN_ID) || DEFAULT_ARBITRUM_CHAIN_ID) ||
    util.getEnv(ENV_ARBITRUM_CHAIN_ID),
  [Networks.Optimism]:
    parseInt(util.getEnv(ENV_OPTIMISM_CHAIN_ID) || DEFAULT_OPTIMISM_CHAIN_ID) ||
    util.getEnv(ENV_OPTIMISM_CHAIN_ID),
  [Networks.Metis]:
    parseInt(util.getEnv(ENV_METIS_CHAIN_ID) || DEFAULT_METIS_CHAIN_ID) ||
    util.getEnv(ENV_METIS_CHAIN_ID),
}

const DEFAULT_OPTIMISM_HEALTH_ENDPOINT = 'https://mainnet-sequencer.optimism.io/health'
const DEFAULT_METIS_HEALTH_ENDPOINT = 'https://tokenapi.metis.io/andromeda/health'
export const HEALTH_ENDPOINTS = {
  [Networks.Arbitrum]: {
    endpoint: util.getEnv('ARBITRUM_HEALTH_ENDPOINT'),
    responsePath: [],
  },
  [Networks.Optimism]: {
    endpoint: util.getEnv('OPTIMISM_HEALTH_ENDPOINT') || DEFAULT_OPTIMISM_HEALTH_ENDPOINT,
    responsePath: ['healthy'],
  },
  [Networks.Metis]: {
    endpoint: util.getEnv('METIS_HEALTH_ENDPOINT') || DEFAULT_METIS_HEALTH_ENDPOINT,
    responsePath: ['healthy'],
  },
  [Networks.Starkware]: {
    endpoint: util.getEnv('STARKWARE_HEALTH_ENDPOINT'),
    responsePath: [],
  },
}

export interface ExtendedConfig extends Config {
  delta: number
  deltaBlocks: number
  timeoutLimit: number
  retryConfig: {
    numRetries: number
    retryInterval: number
  }
  starkwareConfig: {
    provider: SequencerProvider
    dummyAccountAddress: string
  }
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const isCacheEnabled = util.parseBool(util.getEnv('CACHE_ENABLED', undefined, adapterContext))
  if (isCacheEnabled) {
    throw new AdapterConfigError({ message: 'Cache cannot be enabled on this adapter' })
  }
  const config = Requester.getDefaultConfig(prefix)
  const delta = Number(util.getEnv('DELTA', prefix)) || DEFAULT_DELTA_TIME
  const deltaBlocks = Number(util.getEnv('DELTA_BLOCKS', prefix)) || DEFAULT_DELTA_BLOCKS
  const timeoutLimit = Number(util.getEnv('NETWORK_TIMEOUT_LIMIT', prefix)) || DEFAULT_TIMEOUT_LIMIT
  const numRetries = Number(util.getEnv('NUM_RETRIES')) || DEFAULT_NUM_RETRIES
  const retryInterval = Number(util.getEnv('RETRY_INTERVAL')) || DEFAULT_RETRY_INTERVAL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  const starkwareConfig = instantiateStarkwareConfig()
  const retryConfig = {
    numRetries,
    retryInterval,
  }

  return { ...config, delta, deltaBlocks, timeoutLimit, retryConfig, starkwareConfig }
}

const DEFAULT_STARKWARE_SEQUENCER_ENDPOINT = 'https://alpha-mainnet.starknet.io'
const DEFAULT_STARKWARE_FEEDER_GATEWAY_URL = 'feeder_gateway'
const DEFAULT_STARKWARE_GATEWAY_URL = 'gateway'
const DEFAULT_STARKWARE_DUMMY_ACCOUNT_ADDRESS =
  '0x00000000000000000000000000000000000000000000000000000000000001'

const instantiateStarkwareConfig = (): ExtendedConfig['starkwareConfig'] => {
  const baseUrl =
    util.getEnv('STARKWARE_SEQUENCER_ENDPOINT') || DEFAULT_STARKWARE_SEQUENCER_ENDPOINT
  const feederGatewayUrl =
    util.getEnv('STARKWARE_FEEDER_GATEWAY_URL') || DEFAULT_STARKWARE_FEEDER_GATEWAY_URL
  const gatewayUrl = util.getEnv('STARKWARE_GATEWAY_URL') || DEFAULT_STARKWARE_GATEWAY_URL
  const dummyAccountAddress =
    util.getEnv('DEFAULT_STARKWARE_DUMMY_ACCOUNT_ADDRESS') ||
    DEFAULT_STARKWARE_DUMMY_ACCOUNT_ADDRESS
  return {
    provider: new SequencerProvider({
      baseUrl,
      feederGatewayUrl: `${baseUrl}/${feederGatewayUrl}`,
      gatewayUrl: `${baseUrl}/${gatewayUrl}`,
    }),
    dummyAccountAddress,
  }
}
