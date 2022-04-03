import { Config as BaseConfig } from '@chainlink/types'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'

export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'

export const DEFAULT_ENDPOINT = 'price'
export const NAME = 'NFTX_VAULT_PRICE'

export type Config = BaseConfig & {
  provider: ethers.providers.Provider
}

export const makeConfig = (prefix?: string): Config => {
  const rpcUrl = util.getRequiredEnvWithFallback(
    ENV_ETHEREUM_RPC_URL,
    [ENV_FALLBACK_RPC_URL],
    prefix,
  )

  return {
    ...Requester.getDefaultConfig(prefix),
    provider: new ethers.providers.JsonRpcProvider(rpcUrl),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
