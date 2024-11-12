import { AdapterConfigError, Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/ea-bootstrap'

export const NAME = 'COINBASE'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_API_ENDPOINT = 'https://api.coinbase.com'
export const DEFAULT_WS_API_ENDPOINT = 'wss://ws-feed.pro.coinbase.com'

export interface Config extends BaseConfig {
  adapterSpecificParams: {
    nftBaseURL: string
    nftApiAuthHeader: string
  }
}

export const makeConfig = (prefix?: string): Config => {
  const baseConfig = Requester.getDefaultConfig(prefix)
  const nftBaseURL = util.getEnv('NFT_API_ENDPOINT', prefix)
  const nftApiAuthHeader = util.getEnv('NFT_API_AUTH_HEADER', prefix)

  baseConfig.api.baseURL = baseConfig.api.baseURL || DEFAULT_API_ENDPOINT

  baseConfig.defaultEndpoint = DEFAULT_ENDPOINT

  if (nftBaseURL && !nftApiAuthHeader) {
    throw new AdapterConfigError({ message: 'Please set NFT_API_AUTH_HEADER env variable' })
  } else if (!nftBaseURL && nftApiAuthHeader) {
    throw new AdapterConfigError({ message: 'Please set NFT_API_ENDPOINT env variable' })
  }

  return {
    ...baseConfig,
    adapterSpecificParams: {
      nftBaseURL: nftBaseURL || '',
      nftApiAuthHeader: nftApiAuthHeader || '',
    },
  }
}
