import { Config as BaseConfig } from '@chainlink/types'
import { Requester, util } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'

export const ENV_XSUSHI_ADDRESS = 'XSUSHI_ADDRESS'
export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'

export const DEFAULT_XSUSHI_ADDRESS = '0x8798249c2E607446EfB7Ad49eC89dD1865Ff4272'
export const DEFAULT_ENDPOINT = 'price'
export const NAME = 'XSUSHI_PRICE'

export type Config = BaseConfig & {
  xsushiAddress: string
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
    xsushiAddress: util.getEnv(ENV_XSUSHI_ADDRESS, prefix) || DEFAULT_XSUSHI_ADDRESS,
    provider: new ethers.providers.JsonRpcProvider(rpcUrl),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
