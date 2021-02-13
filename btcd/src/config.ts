import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_ENDPOINT = 'balance'
const DEFAULT_CHAIN = 'mainnet'
const DEFAULT_COIN = 'btc'

const ENV_CHAIN = 'CHAIN'
const ENV_COIN = 'COIN'

export type BtcdConfig = Config & {
  chain: string
  coin: string
}

export const makeConfig = (prefix?: string): BtcdConfig => {
  const defaultConfig = Requester.getDefaultConfig(prefix)
  defaultConfig.api.baseURL = defaultConfig.api.baseURL || 'http://localhost:18081'

  return {
    ...defaultConfig,
    chain: util.getEnv(ENV_CHAIN, prefix) || DEFAULT_CHAIN,
    coin: util.getEnv(ENV_COIN, prefix) || DEFAULT_COIN,
  }
}
