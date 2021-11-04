import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig, ConfigFactory } from '@chainlink/types'
import { ethers } from 'ethers'

export const NAME = 'UNISWAP_V3'

export const ENV_RPC_URL = 'RPC_URL'
export const ENV_BLOCKCHAIN_NETWORK = 'BLOCKCHAIN_NETWORK'
export const ENV_QUOTER_CONTRACT = 'QUOTER_CONTRACT'
export const ENV_FEE_TIERS = 'DEFAULT_FEE_TIERS'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_BLOCKCHAIN_NETWORK = 'ethereum'

// https://docs.uniswap.org/protocol/concepts/V3-overview/fees#pool-fees-tiers
// LOW    MID    HIGH
// 0.05%  0.30%  1.00%
// 500    3000   10000
export const DEFAULT_FEE_TIERS = '500,3000,10000' //[500, 3_000, 10_000]
export const DEFAULT_QUOTER_CONTRACT = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6'

export type Config = BaseConfig & {
  provider: ethers.providers.Provider
  network: string
  uniswapQuoter: string
  feeTiers: number[]
}

export const makeConfig: ConfigFactory<Config> = (prefix: string | undefined) => {
  let parsedFeeTiers = DEFAULT_FEE_TIERS.split(',').map((f) => parseInt(f))
  if (util.getEnv(ENV_FEE_TIERS, prefix)) {
    parsedFeeTiers = util
      .getEnv(ENV_FEE_TIERS, prefix)!
      .split(',')
      .map((f) => parseInt(f))
  }

  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    provider: new ethers.providers.JsonRpcProvider(util.getRequiredEnv(ENV_RPC_URL, prefix)),
    network: util.getEnv(ENV_BLOCKCHAIN_NETWORK, prefix) || DEFAULT_BLOCKCHAIN_NETWORK,
    uniswapQuoter: util.getEnv(ENV_QUOTER_CONTRACT, prefix) || DEFAULT_QUOTER_CONTRACT,
    feeTiers: parsedFeeTiers,
  }
}
