import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig, ConfigFactory } from '@chainlink/types'
import { ethers } from 'ethers'

export const NAME = 'UNISWAP-V2'

export const ENV_RPC_URL = 'RPC_URL'
export const ENV_BLOCKCHAIN_NETWORK = 'BLOCKCHAIN_NETWORK'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_BLOCKCHAIN_NETWORK = 'ethereum'
export const UNISWAP_ROUTER_CONTRACT = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'

export type Config = BaseConfig & {
  provider: ethers.providers.Provider
  network: string
  uniswapRouter: string
}

export const makeConfig: ConfigFactory<Config> = (prefix: string | undefined) => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    provider: new ethers.providers.JsonRpcProvider(util.getRequiredEnv(ENV_RPC_URL, prefix)),
    network: util.getEnv(ENV_BLOCKCHAIN_NETWORK, prefix) || DEFAULT_BLOCKCHAIN_NETWORK,
    uniswapRouter: UNISWAP_ROUTER_CONTRACT,
  }
}
