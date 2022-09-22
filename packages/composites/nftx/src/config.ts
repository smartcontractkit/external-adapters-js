import { Config as BaseConfig } from '@chainlink/ea-bootstrap'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'

export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'

export const DEFAULT_ENDPOINT = 'price'
export const NAME = 'NFTX_VAULT_PRICE'

export const ENV_ETHEREUM_CHAIN_ID = 'ETHEREUM_CHAIN_ID'
export const ENV_FALLBACK_CHAIN_ID = 'CHAIN_ID'
export const DEFAULT_CHAIN_ID = '1'

export type Config = BaseConfig & {
  provider: ethers.providers.Provider
}

export const makeConfig = (prefix?: string): Config => {
  const rpcUrl = util.getRequiredEnvWithFallback(
    ENV_ETHEREUM_RPC_URL,
    [ENV_FALLBACK_RPC_URL],
    prefix,
  )

  const chainId =
    parseInt(
      util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID]) || DEFAULT_CHAIN_ID,
    ) || util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID])

  return {
    ...Requester.getDefaultConfig(prefix),
    provider: new ethers.providers.JsonRpcProvider(rpcUrl, chainId),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
