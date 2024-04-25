import { AdapterConfigError, Requester, util } from '@chainlink/ea-bootstrap'
import { AdapterContext, Config } from '@chainlink/ea-bootstrap'
import { envDefaultOverrides } from './envDefaultOverrides'
import { RpcProvider } from 'starknet'

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
export const ENV_BASE_RPC_ENDPOINT = 'BASE_RPC_ENDPOINT'
export const ENV_METIS_RPC_ENDPOINT = 'METIS_RPC_ENDPOINT'
export const ENV_SCROLL_RPC_ENDPOINT = 'SCROLL_RPC_ENDPOINT'

export const ENV_ARBITRUM_CHAIN_ID = 'ARBITRUM_CHAIN_ID'
export const ENV_OPTIMISM_CHAIN_ID = 'OPTIMISM_CHAIN_ID'
export const ENV_BASE_CHAIN_ID = 'BASE_CHAIN_ID'
export const ENV_METIS_CHAIN_ID = 'METIS_CHAIN_ID'
export const ENV_SCROLL_CHAIN_ID = 'SCROLL_CHAIN_ID'

export const DEFAULT_ARBITRUM_CHAIN_ID = '42161'
export const DEFAULT_OPTIMISM_CHAIN_ID = '10'
export const DEFAULT_BASE_CHAIN_ID = '8453'
export const DEFAULT_METIS_CHAIN_ID = '1088'
export const DEFAULT_SCROLL_CHAIN_ID = '534352'

export enum Networks {
  Arbitrum = 'arbitrum',
  Optimism = 'optimism',
  Base = 'base',
  Metis = 'metis',
  Scroll = 'scroll',
  Starkware = 'starkware',
}

export type EVMNetworks = Exclude<Networks, Networks.Starkware>

const DEFAULT_ARBITRUM_RPC_ENDPOINT = 'https://arb1.arbitrum.io/rpc'
const DEFAULT_OPTIMISM_RPC_ENDPOINT = 'https://mainnet.optimism.io'
const DEFAULT_BASE_RPC_ENDPOINT = 'https://mainnet.base.org'
const DEFAULT_METIS_RPC_ENDPOINT = 'https://andromeda.metis.io/?owner=1088'
const DEFAULT_SCROLL_RPC_ENDPOINT = 'https://rpc.scroll.io'

export const RPC_ENDPOINTS: Record<EVMNetworks, string | undefined> = {
  [Networks.Arbitrum]: util.getEnv(ENV_ARBITRUM_RPC_ENDPOINT) || DEFAULT_ARBITRUM_RPC_ENDPOINT,
  [Networks.Optimism]: util.getEnv(ENV_OPTIMISM_RPC_ENDPOINT) || DEFAULT_OPTIMISM_RPC_ENDPOINT,
  [Networks.Base]: util.getEnv(ENV_BASE_RPC_ENDPOINT) || DEFAULT_BASE_RPC_ENDPOINT,
  [Networks.Metis]: util.getEnv(ENV_METIS_RPC_ENDPOINT) || DEFAULT_METIS_RPC_ENDPOINT,
  [Networks.Scroll]: util.getEnv(ENV_SCROLL_RPC_ENDPOINT) || DEFAULT_SCROLL_RPC_ENDPOINT,
}

export const CHAIN_IDS: Record<EVMNetworks, number | undefined | string> = {
  [Networks.Arbitrum]:
    parseInt(util.getEnv(ENV_ARBITRUM_CHAIN_ID) || DEFAULT_ARBITRUM_CHAIN_ID) ||
    util.getEnv(ENV_ARBITRUM_CHAIN_ID),
  [Networks.Optimism]:
    parseInt(util.getEnv(ENV_OPTIMISM_CHAIN_ID) || DEFAULT_OPTIMISM_CHAIN_ID) ||
    util.getEnv(ENV_OPTIMISM_CHAIN_ID),
  [Networks.Base]:
    parseInt(util.getEnv(ENV_BASE_CHAIN_ID) || DEFAULT_BASE_CHAIN_ID) ||
    util.getEnv(ENV_BASE_CHAIN_ID),
  [Networks.Metis]:
    parseInt(util.getEnv(ENV_METIS_CHAIN_ID) || DEFAULT_METIS_CHAIN_ID) ||
    util.getEnv(ENV_METIS_CHAIN_ID),
  [Networks.Scroll]:
    parseInt(util.getEnv(ENV_SCROLL_CHAIN_ID) || DEFAULT_SCROLL_CHAIN_ID) ||
    util.getEnv(ENV_SCROLL_CHAIN_ID),
}

const DEFAULT_METIS_HEALTH_ENDPOINT = 'https://andromeda-healthy.metisdevops.link/health'
export const HEALTH_ENDPOINTS: Record<
  Networks,
  { endpoint: string | undefined; responsePath: string[] }
> = {
  [Networks.Arbitrum]: {
    endpoint: util.getEnv('ARBITRUM_HEALTH_ENDPOINT'),
    responsePath: [],
  },
  [Networks.Optimism]: {
    endpoint: util.getEnv('OPTIMISM_HEALTH_ENDPOINT'),
    responsePath: ['healthy'],
  },
  [Networks.Base]: {
    endpoint: util.getEnv('BASE_HEALTH_ENDPOINT'),
    responsePath: [],
  },
  [Networks.Metis]: {
    endpoint: util.getEnv('METIS_HEALTH_ENDPOINT') || DEFAULT_METIS_HEALTH_ENDPOINT,
    responsePath: ['healthy'],
  },
  [Networks.Scroll]: {
    endpoint: util.getEnv('SCROLL_HEALTH_ENDPOINT'),
    responsePath: [],
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
    provider: RpcProvider
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

const DEFAULT_STARKWARE_RPC_ENDPOINT = 'https://starknet-mainnet.public.blastapi.io'
const DEFAULT_STARKWARE_DUMMY_ACCOUNT_ADDRESS =
  '0x00000000000000000000000000000000000000000000000000000000000001'

const instantiateStarkwareConfig = (): ExtendedConfig['starkwareConfig'] => {
  const dummyAddr = util.getEnv('DEFAULT_STARKWARE_DUMMY_ACCOUNT_ADDRESS')
  const rpcUrl = util.getEnv('STARKWARE_RPC_ENDPOINT')
  return {
    dummyAccountAddress: dummyAddr ?? DEFAULT_STARKWARE_DUMMY_ACCOUNT_ADDRESS,
    provider: new RpcProvider({
      nodeUrl: rpcUrl ?? DEFAULT_STARKWARE_RPC_ENDPOINT,
    }),
  }
}
