import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'COINBASE'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_API_ENDPOINT = 'https://api.coinbase.comm'
export const DEFAULT_NFT_API_ENDPOINT = 'https://nft-api.coinbase.com'
export const DEFAULT_WS_API_ENDPOINT = 'wss://ws-feed.pro.coinbase.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.adapterSpecificParams = {
    nftBaseURL: util.getEnv('NFT_API_ENDPOINT', prefix) || DEFAULT_NFT_API_ENDPOINT,
    nftApiAuthHeader: util.getEnv('NFT_API_AUTH_HEADER', prefix) || '',
  }
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
