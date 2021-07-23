import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'LAYER2_SEQUENCER_HEALTH'

// 3 minutes
export const DEFAULT_DELTA_TIME = 3 * 60 * 1000

export enum Networks {
  Arbitrum = 'arbitrum',
  Optimism = 'optimism',
}

export const BASE_URLS = {
  [Networks.Arbitrum]: 'https://rinkeby.arbitrum.io',
  [Networks.Optimism]: 'https://optimism.io',
}

export interface ExtendedConfig extends Config {
  delta: number
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const config = Requester.getDefaultConfig(prefix)
  const delta = Number(util.getEnv('DELTA', prefix)) || DEFAULT_DELTA_TIME
  return { ...config, delta }
}
