import { AdapterConfigError, Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'COINBASE'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_API_ENDPOINT = 'https://api.coinbase.com'
export const DEFAULT_NFT_API_ENDPOINT = 'https://nft-api.coinbase.com'
export const DEFAULT_WS_API_ENDPOINT = 'wss://ws-feed.pro.coinbase.com'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  const nftBaseURL = util.getEnv('NFT_API_ENDPOINT', prefix)
  const nftApiAuthHeader = util.getEnv('NFT_API_AUTH_HEADER', prefix)

  config.api.baseURL = config.api.baseURL || DEFAULT_API_ENDPOINT
  config.adapterSpecificParams = {
    nftBaseURL: nftBaseURL || '',
    nftApiAuthHeader: nftApiAuthHeader || '',
  }
  config.defaultEndpoint = DEFAULT_ENDPOINT

  if (nftBaseURL && !nftApiAuthHeader) {
    throw new AdapterConfigError({ message: 'Please set NFT_API_AUTH_HEADER env variable' })
  } else if (!nftBaseURL && nftApiAuthHeader) {
    throw new AdapterConfigError({ message: 'Please set NFT_API_ENDPOINT env variable' })
  }

  return config
}
