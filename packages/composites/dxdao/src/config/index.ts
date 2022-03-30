import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export interface ExtendedConfig extends Config {
  RPC_URL?: string
  wethContractAddress: string
}

export const NAME = 'DX_DAO'
export const DEFAULT_ENDPOINT = 'TVL'
export const DEFAULT_RPC_URL = 'http://localhost:8545'
export const DEFAULT_WETH_CONTRACT_ADDRESS = '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1'

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const RPC_URL = util.getRequiredEnvWithFallback('XDAI_RPC_URL', ['RPC_URL'], prefix)
  const WETH_CONTRACT_ADDRESS =
    util.getEnv('WETH_CONTRACT_ADDRESS') || DEFAULT_WETH_CONTRACT_ADDRESS
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    wethContractAddress: WETH_CONTRACT_ADDRESS,
    RPC_URL: RPC_URL || DEFAULT_RPC_URL,
  }
}
