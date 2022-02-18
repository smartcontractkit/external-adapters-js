import { Config as BaseConfig } from '@chainlink/types'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'

export const ENV_VAULT_ADDRESS = 'VAULT_ADDRESS'
export const ENV_TOKEN_ADDRESS = 'TOKEN_ADDRESS'
export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'

export const DEFAULT_VAULT_ADDRESS = '0x269616D549D7e8Eaa82DFb17028d0B212D11232A'
export const DEFAULT_TOKEN_ADDRESS = '0x9cea2eD9e47059260C97d697f82b8A14EfA61EA5'
export const DEFAULT_ENDPOINT = 'punk'
export const NAME = 'NFTX_VAULT_PRICE'

export type Config = BaseConfig & {
  vaultAddress: string
  tokenAddress: string
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
    vaultAddress: util.getEnv(ENV_VAULT_ADDRESS, prefix) || DEFAULT_VAULT_ADDRESS,
    tokenAddress: util.getEnv(ENV_TOKEN_ADDRESS) || DEFAULT_TOKEN_ADDRESS,
    provider: new ethers.providers.JsonRpcProvider(rpcUrl),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
