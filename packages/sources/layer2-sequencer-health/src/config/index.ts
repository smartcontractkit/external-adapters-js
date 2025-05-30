import { AdapterConfigError, Requester, util } from '@chainlink/ea-bootstrap'
import { AdapterContext, Config } from '@chainlink/ea-bootstrap'
import { envDefaultOverrides } from './envDefaultOverrides'
import { RpcProvider } from 'starknet'

export const NAME = 'LAYER2_SEQUENCER_HEALTH'
export const DEFAULT_PRIVATE_KEY =
  '0x0000000000000000000000000000000000000000000000000000000000000001'

export const adapterContext: AdapterContext = { name: NAME, envDefaultOverrides }

export const DEFAULT_ENDPOINT = 'health'

// 2 minutes
export const DEFAULT_DELTA_TIME = 2 * 60 * 1000
// 10 minutes
export const DEFAULT_DELTA_TIME_METIS = 10 * 60 * 1000
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
export const ENV_LINEA_RPC_ENDPOINT = 'LINEA_RPC_ENDPOINT'
export const ENV_METIS_RPC_ENDPOINT = 'METIS_RPC_ENDPOINT'
export const ENV_SCROLL_RPC_ENDPOINT = 'SCROLL_RPC_ENDPOINT'
export const ENV_ZKSYNC_RPC_ENDPOINT = 'ZKSYNC_RPC_ENDPOINT'
export const ENV_INK_RPC_ENDPOINT = 'INK_RPC_ENDPOINT'
export const ENV_MANTLE_RPC_ENDPOINT = 'MANTLE_RPC_ENDPOINT'
export const ENV_UNICHAIN_RPC_ENDPOINT = 'UNICHAIN_RPC_ENDPOINT'
export const ENV_SONEIUM_RPC_ENDPOINT = 'SONEIUM_RPC_ENDPOINT'
export const ENV_CELO_RPC_ENDPOINT = 'CELO_RPC_ENDPOINT'

export const ENV_ARBITRUM_CHAIN_ID = 'ARBITRUM_CHAIN_ID'
export const ENV_OPTIMISM_CHAIN_ID = 'OPTIMISM_CHAIN_ID'
export const ENV_BASE_CHAIN_ID = 'BASE_CHAIN_ID'
export const ENV_LINEA_CHAIN_ID = 'BASE_CHAIN_ID'
export const ENV_METIS_CHAIN_ID = 'METIS_CHAIN_ID'
export const ENV_SCROLL_CHAIN_ID = 'SCROLL_CHAIN_ID'
export const ENV_ZKSYNC_CHAIN_ID = 'ZKSYNC_CHAIN_ID'
export const ENV_INK_CHAIN_ID = 'INK_CHAIN_ID'
export const ENV_MANTLE_CHAIN_ID = 'MANTLE_CHAIN_ID'
export const ENV_UNICHAIN_CHAIN_ID = 'UNICHAIN_CHAIN_ID'
export const ENV_SONEIUM_CHAIN_ID = 'SONEIUM_CHAIN_ID'
export const ENV_CELO_CHAIN_ID = 'CELO_CHAIN_ID'

export const DEFAULT_ARBITRUM_CHAIN_ID = '42161'
export const DEFAULT_OPTIMISM_CHAIN_ID = '10'
export const DEFAULT_BASE_CHAIN_ID = '8453'
export const DEFAULT_LINEA_CHAIN_ID = '59144'
export const DEFAULT_METIS_CHAIN_ID = '1088'
export const DEFAULT_SCROLL_CHAIN_ID = '534352'
export const DEFAULT_ZKSYNC_CHAIN_ID = '324'
export const DEFAULT_INK_CHAIN_ID = '57073'
export const DEFAULT_MANTLE_CHAIN_ID = '5000'
export const DEFAULT_UNICHAIN_CHAIN_ID = '130'
export const DEFAULT_SONEIUM_CHAIN_ID = '1868'
export const DEFAULT_CELO_CHAIN_ID = '42220'

export enum Networks {
  Arbitrum = 'arbitrum',
  Optimism = 'optimism',
  Base = 'base',
  Linea = 'linea',
  Metis = 'metis',
  Scroll = 'scroll',
  Starkware = 'starkware',
  zkSync = 'zksync',
  Ink = 'ink',
  Mantle = 'mantle',
  Unichain = 'unichain',
  Soneium = 'soneium',
  Celo = 'celo',
}

export type EVMNetworks = Exclude<Networks, Networks.Starkware>

const DEFAULT_ARBITRUM_RPC_ENDPOINT = 'https://arb1.arbitrum.io/rpc'
const DEFAULT_OPTIMISM_RPC_ENDPOINT = 'https://mainnet.optimism.io'
const DEFAULT_BASE_RPC_ENDPOINT = 'https://mainnet.base.org'
const DEFAULT_LINEA_RPC_ENDPOINT = 'https://rpc.linea.build'
const DEFAULT_METIS_RPC_ENDPOINT = 'https://andromeda.metis.io/?owner=1088'
const DEFAULT_SCROLL_RPC_ENDPOINT = 'https://rpc.scroll.io'
const DEFAULT_ZKSYNC_RPC_ENDPOINT = 'https://mainnet.era.zksync.io'
const DEFAULT_INK_RPC_ENDPOINT = 'https://rpc-gel.inkonchain.com'
const DEFAULT_MANTLE_RPC_ENDPOINT = 'https://rpc.mantle.xyz'
const DEFAULT_UNICHAIN_RPC_ENDPOINT = 'https://mainnet.unichain.org'
const DEFAULT_SONEIUM_RPC_ENDPOINT = 'https://rpc.soneium.org'
const DEFAULT_CELO_RPC_ENDPOINT = 'https://forno.celo.org'

export const RPC_ENDPOINTS: Record<EVMNetworks, string | undefined> = {
  [Networks.Arbitrum]: util.getEnv(ENV_ARBITRUM_RPC_ENDPOINT) || DEFAULT_ARBITRUM_RPC_ENDPOINT,
  [Networks.Optimism]: util.getEnv(ENV_OPTIMISM_RPC_ENDPOINT) || DEFAULT_OPTIMISM_RPC_ENDPOINT,
  [Networks.Base]: util.getEnv(ENV_BASE_RPC_ENDPOINT) || DEFAULT_BASE_RPC_ENDPOINT,
  [Networks.Linea]: util.getEnv(ENV_LINEA_RPC_ENDPOINT) || DEFAULT_LINEA_RPC_ENDPOINT,
  [Networks.Metis]: util.getEnv(ENV_METIS_RPC_ENDPOINT) || DEFAULT_METIS_RPC_ENDPOINT,
  [Networks.Scroll]: util.getEnv(ENV_SCROLL_RPC_ENDPOINT) || DEFAULT_SCROLL_RPC_ENDPOINT,
  [Networks.zkSync]: util.getEnv(ENV_ZKSYNC_RPC_ENDPOINT) || DEFAULT_ZKSYNC_RPC_ENDPOINT,
  [Networks.Ink]: util.getEnv(ENV_INK_RPC_ENDPOINT) || DEFAULT_INK_RPC_ENDPOINT,
  [Networks.Mantle]: util.getEnv(ENV_MANTLE_RPC_ENDPOINT) || DEFAULT_MANTLE_RPC_ENDPOINT,
  [Networks.Unichain]: util.getEnv(ENV_UNICHAIN_RPC_ENDPOINT) || DEFAULT_UNICHAIN_RPC_ENDPOINT,
  [Networks.Soneium]: util.getEnv(ENV_SONEIUM_RPC_ENDPOINT) || DEFAULT_SONEIUM_RPC_ENDPOINT,
  [Networks.Celo]: util.getEnv(ENV_CELO_RPC_ENDPOINT) || DEFAULT_CELO_RPC_ENDPOINT,
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
  [Networks.Linea]:
    parseInt(util.getEnv(ENV_LINEA_CHAIN_ID) || DEFAULT_LINEA_CHAIN_ID) ||
    util.getEnv(ENV_LINEA_CHAIN_ID),
  [Networks.Metis]:
    parseInt(util.getEnv(ENV_METIS_CHAIN_ID) || DEFAULT_METIS_CHAIN_ID) ||
    util.getEnv(ENV_METIS_CHAIN_ID),
  [Networks.Scroll]:
    parseInt(util.getEnv(ENV_SCROLL_CHAIN_ID) || DEFAULT_SCROLL_CHAIN_ID) ||
    util.getEnv(ENV_SCROLL_CHAIN_ID),
  [Networks.zkSync]:
    parseInt(util.getEnv(ENV_ZKSYNC_CHAIN_ID) || DEFAULT_ZKSYNC_CHAIN_ID) ||
    util.getEnv(ENV_ZKSYNC_CHAIN_ID),
  [Networks.Ink]:
    parseInt(util.getEnv(ENV_INK_CHAIN_ID) || DEFAULT_INK_CHAIN_ID) ||
    util.getEnv(ENV_INK_CHAIN_ID),
  [Networks.Mantle]:
    parseInt(util.getEnv(ENV_MANTLE_CHAIN_ID) || DEFAULT_MANTLE_CHAIN_ID) ||
    util.getEnv(ENV_MANTLE_CHAIN_ID),
  [Networks.Unichain]:
    parseInt(util.getEnv(ENV_UNICHAIN_CHAIN_ID) || DEFAULT_UNICHAIN_CHAIN_ID) ||
    util.getEnv(ENV_UNICHAIN_CHAIN_ID),
  [Networks.Soneium]:
    parseInt(util.getEnv(ENV_SONEIUM_CHAIN_ID) || DEFAULT_SONEIUM_CHAIN_ID) ||
    util.getEnv(ENV_SONEIUM_CHAIN_ID),
  [Networks.Celo]:
    parseInt(util.getEnv(ENV_CELO_CHAIN_ID) || DEFAULT_CELO_CHAIN_ID) ||
    util.getEnv(ENV_CELO_CHAIN_ID),
}

export const CHAIN_DELTA: Record<Networks, number> = {
  [Networks.Arbitrum]: Number(util.getEnv('ARBITRUM_DELTA')) || DEFAULT_DELTA_TIME,
  [Networks.Optimism]: Number(util.getEnv('OPTIMISM_DELTA')) || DEFAULT_DELTA_TIME,
  [Networks.Base]: Number(util.getEnv('BASE_DELTA')) || DEFAULT_DELTA_TIME,
  [Networks.Linea]: Number(util.getEnv('LINEA_DELTA')) || DEFAULT_DELTA_TIME,
  [Networks.Metis]: Number(util.getEnv('METIS_DELTA')) || DEFAULT_DELTA_TIME_METIS,
  [Networks.Scroll]: Number(util.getEnv('SCROLL_DELTA')) || DEFAULT_DELTA_TIME,
  [Networks.Starkware]: Number(util.getEnv('STARKWARE_DELTA')) || DEFAULT_DELTA_TIME,
  [Networks.zkSync]: Number(util.getEnv('ZKSYNC_DELTA')) || DEFAULT_DELTA_TIME,
  [Networks.Ink]: Number(util.getEnv('INK_DELTA')) || DEFAULT_DELTA_TIME,
  [Networks.Mantle]: Number(util.getEnv('MANTLE_DELTA')) || DEFAULT_DELTA_TIME,
  [Networks.Unichain]: Number(util.getEnv('UNICHAIN_DELTA')) || DEFAULT_DELTA_TIME,
  [Networks.Soneium]: Number(util.getEnv('SONEIUM_DELTA')) || DEFAULT_DELTA_TIME,
  [Networks.Celo]: Number(util.getEnv('CELO_DELTA')) || DEFAULT_DELTA_TIME,
}

const DEFAULT_METIS_HEALTH_ENDPOINT = 'https://andromeda-healthy.metisdevops.link/health'
const DEFAULT_SCROLL_HEALTH_ENDPOINT = 'https://venus.scroll.io/v1/sequencer/status'

export type HeathEndpoints = Record<
  Networks,
  {
    endpoint: string | undefined
    responsePath: string[]
    processResponse: (data: unknown) => boolean | undefined
  }
>

export const HEALTH_ENDPOINTS: HeathEndpoints = {
  [Networks.Arbitrum]: {
    endpoint: util.getEnv('ARBITRUM_HEALTH_ENDPOINT'),
    responsePath: [],
    processResponse: () => undefined,
  },
  [Networks.Optimism]: {
    endpoint: util.getEnv('OPTIMISM_HEALTH_ENDPOINT'),
    responsePath: ['healthy'],
    processResponse: () => undefined,
  },
  [Networks.Base]: {
    endpoint: util.getEnv('BASE_HEALTH_ENDPOINT'),
    responsePath: [],
    processResponse: () => undefined,
  },
  [Networks.Linea]: {
    endpoint: util.getEnv('LINEA_HEALTH_ENDPOINT'),
    responsePath: [],
    processResponse: () => undefined,
  },
  [Networks.Metis]: {
    endpoint: util.getEnv('METIS_HEALTH_ENDPOINT') || DEFAULT_METIS_HEALTH_ENDPOINT,
    responsePath: ['healthy'],
    processResponse: (data: unknown) => defaultProcessResponse(data, Networks.Metis),
  },
  [Networks.Scroll]: {
    endpoint: util.getEnv('SCROLL_HEALTH_ENDPOINT') || DEFAULT_SCROLL_HEALTH_ENDPOINT,
    responsePath: ['data', 'health'],
    processResponse: (data: unknown) => Requester.getResult(data, ['data', 'health']) == 1,
  },
  [Networks.Starkware]: {
    endpoint: util.getEnv('STARKWARE_HEALTH_ENDPOINT'),
    responsePath: [],
    processResponse: () => undefined,
  },
  [Networks.zkSync]: {
    endpoint: util.getEnv('ZKSYNC_HEALTH_ENDPOINT'),
    responsePath: [],
    processResponse: () => undefined,
  },
  [Networks.Ink]: {
    endpoint: util.getEnv('INK_HEALTH_ENDPOINT'),
    responsePath: [],
    processResponse: () => undefined,
  },
  [Networks.Mantle]: {
    endpoint: util.getEnv('MANTLE_HEALTH_ENDPOINT'),
    responsePath: [],
    processResponse: () => undefined,
  },
  [Networks.Unichain]: {
    endpoint: util.getEnv('UNICHAIN_HEALTH_ENDPOINT'),
    responsePath: [],
    processResponse: () => undefined,
  },
  [Networks.Soneium]: {
    endpoint: util.getEnv('SONEIUM_HEALTH_ENDPOINT'),
    responsePath: [],
    processResponse: () => undefined,
  },
  [Networks.Celo]: {
    endpoint: util.getEnv('CELO_HEALTH_ENDPOINT'),
    responsePath: [],
    processResponse: () => undefined,
  },
}

const defaultProcessResponse = (data: unknown, network: Networks) =>
  !!Requester.getResult(data, HEALTH_ENDPOINTS[network]?.responsePath)

export interface ExtendedConfig extends Config {
  deltaBlocks: number
  deltaChain: Record<Networks, number>
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
  const deltaChain = CHAIN_DELTA
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

  return { ...config, deltaChain, deltaBlocks, timeoutLimit, retryConfig, starkwareConfig }
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
