import { HTTP, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export interface ExtendedConfig extends Config {
  BITCOIN_MAINNET_POR_INDEXER_URL?: string
  DOGECOIN_MAINNET_POR_INDEXER_URL?: string
  DOGECOIN_TESTNET_POR_INDEXER_URL?: string
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const BITCOIN_MAINNET_POR_INDEXER_URL = util.getEnv('BITCOIN_MAINNET_POR_INDEXER_URL', prefix)
  const DOGECOIN_MAINNET_POR_INDEXER_URL = util.getEnv('DOGECOIN_MAINNET_POR_INDEXER_URL', prefix)
  const DOGECOIN_TESTNET_POR_INDEXER_URL = util.getEnv('DOGECOIN_TESTNET_POR_INDEXER_URL', prefix)
  return {
    ...HTTP.getDefaultConfig(prefix),
    BITCOIN_MAINNET_POR_INDEXER_URL,
    DOGECOIN_MAINNET_POR_INDEXER_URL,
    DOGECOIN_TESTNET_POR_INDEXER_URL,
  }
}
