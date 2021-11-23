import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export interface ExtendedConfig extends Config {
  BTC_MAINNET_POR_INDEXER_URL: string
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const BTC_MAINNET_POR_INDEXER_URL = util.getRequiredEnv('BTC_MAINNET_POR_INDEXER_URL', prefix)
  return {
    ...Requester.getDefaultConfig(prefix),
    BTC_MAINNET_POR_INDEXER_URL,
  }
}
