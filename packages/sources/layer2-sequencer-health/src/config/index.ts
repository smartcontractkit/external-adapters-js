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
  [Networks.Arbitrum]: util.getEnv('ARBITRUM_RPC_ENDPOINT') || DEFAULT_ARBITRUM_RPC_ENDPOINT,
  [Networks.Optimism]: util.getEnv('OPTIMISM_RPC_ENDPOINT') || DEFAULT_OPTIMISM_RPC_ENDPOINT,
  [Networks.Metis]: util.getEnv('METIS_RPC_ENDPOINT') || DEFAULT_METIS_RPC_ENDPOINT,
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
  starkwareConfig: {
    provider: SequencerProvider
    argentAccountAddr: string
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
  config.defaultEndpoint = DEFAULT_ENDPOINT
  const starkwareConfig = instantiateStarkwareConfig()

  return { ...config, delta, deltaBlocks, timeoutLimit, starkwareConfig }
}

const DEFAULT_STARKWARE_SEQUENCER_ENDPOINT = 'https://alpha-mainnet.starknet.io'
const DEFAULT_STARKWARE_FEEDER_GATEWAY_URL = 'feeder_gateway'
const DEFAULT_STARKWARE_GATEWAY_URL = 'gateway'
const DEFAULT_STARKWARE_ARGENT_ACCOUNT_ADDR =
  '0x163995f6cbc4e9e3908ce6161a0bef4459847b42077be419e257c7f837a224a'

const instantiateStarkwareConfig = (): ExtendedConfig['starkwareConfig'] => {
  const baseUrl =
    util.getEnv('STARKWARE_SEQUENCER_ENDPOINT') || DEFAULT_STARKWARE_SEQUENCER_ENDPOINT
  const feederGatewayUrl =
    util.getEnv('STARKWARE_FEEDER_GATEWAY_URL') || DEFAULT_STARKWARE_FEEDER_GATEWAY_URL
  const gatewayUrl = util.getEnv('STARKWARE_GATEWAY_URL') || DEFAULT_STARKWARE_GATEWAY_URL
  const argentAccountAddr =
    util.getEnv('STARKWARE_ARGENT_ACCOUNT_ADDR') || DEFAULT_STARKWARE_ARGENT_ACCOUNT_ADDR
  return {
    provider: new SequencerProvider({
      baseUrl: DEFAULT_STARKWARE_SEQUENCER_ENDPOINT,
      feederGatewayUrl: `${baseUrl}/${feederGatewayUrl}`,
      gatewayUrl: `${baseUrl}/${gatewayUrl}`,
    }),
    argentAccountAddr: argentAccountAddr,
  }
}
