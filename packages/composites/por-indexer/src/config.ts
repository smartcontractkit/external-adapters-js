import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export interface ExtendedConfig extends Config {
  BITCOIN_MAINNET_POR_INDEXER_URL: string
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const BITCOIN_MAINNET_POR_INDEXER_URL = util.getRequiredEnv(
    'BITCOIN_MAINNET_POR_INDEXER_URL',
    prefix,
  )
  return {
    ...Requester.getDefaultConfig(prefix),
    BITCOIN_MAINNET_POR_INDEXER_URL,
  }
}
