import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const NAME = 'SYNTHETIX_DEBT_POOL'

export const DEFAULT_ENDPOINT = 'debt'
export const DEFAULT_DEBT_POOL_CACHE_ADDRESS = '0x9bB05EF2cA7DBAafFC3da1939D1492e6b00F39b8'

export interface Config extends DefaultConfig {
  debtPoolCacheAddress: string
  rpcUrl: string
}

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    debtPoolCacheAddress: util.getEnv('DEBT_POOL_CACHE_ADDRESS') || DEFAULT_DEBT_POOL_CACHE_ADDRESS,
    rpcUrl: util.getRequiredEnv('RPC_URL'),
  }
}
