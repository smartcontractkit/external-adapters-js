import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'L2_SEQUENCER_HEALTH'

// 2 minutes
export const DEFAULT_DELTA_TIME = 2 * 60 * 1000

export enum Networks {
  Arbitrum = 'arbitrum',
  Optimism = 'optimism',
}

export const RPC_ENDPOINTS = {
  [Networks.Arbitrum]: util.getEnv('ARBITRUM_RPC_ENDPOINT') || 'https://arb1.arbitrum.io/rpc',
  [Networks.Optimism]: util.getEnv('OPTIMISM_RPC_ENDPOINT') || 'https://mainnet.optimism.io',
}

export const HEALTH_ENDPOINTS = {
  [Networks.Arbitrum]: {
    endpoint: util.getEnv('ARBITRUM_HEALTH_ENDPOINT'),
    responsePath: [],
  },
  [Networks.Optimism]: {
    endpoint:
      util.getEnv('OPTIMISM_HEALTH_ENDPOINT') || 'https://mainnet-sequencer.optimism.io/health',
    responsePath: ['healthy'],
  },
}

export interface ExtendedConfig extends Config {
  delta: number
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const isCacheEnabled = util.parseBool(util.getEnv('CACHE_ENABLED'))
  if (isCacheEnabled) {
    throw new Error('Cache cannot be enabled on this adapter')
  }
  const config = Requester.getDefaultConfig(prefix)
  const delta = Number(util.getEnv('DELTA', prefix)) || DEFAULT_DELTA_TIME
  return { ...config, delta }
}
