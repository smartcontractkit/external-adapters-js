import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'LAYER2_SEQUENCER_HEALTH'

// 3 minutes
export const DEFAULT_DELTA_TIME = 3 * 60 * 1000

export enum Networks {
  Arbitrum = 'arbitrum',
  Optimism = 'optimism',
}

export const RPC_ENDPOINTS = {
  [Networks.Arbitrum]: 'https://arb1.arbitrum.io/rpc',
  [Networks.Optimism]: 'https://mainnet.optimism.io',
}

export const HEALTH_ENDPOINTS = {
  [Networks.Arbitrum]: {
    endpoint: undefined,
    responsePath: [],
  },
  [Networks.Optimism]: {
    endpoint: 'https://mainnet-sequencer.optimism.io/health',
    responsePath: ['healthy'],
  },
}

export interface ExtendedConfig extends Config {
  delta: number
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const config = Requester.getDefaultConfig(prefix)
  const delta = Number(util.getEnv('DELTA', prefix)) || DEFAULT_DELTA_TIME
  return { ...config, delta }
}
