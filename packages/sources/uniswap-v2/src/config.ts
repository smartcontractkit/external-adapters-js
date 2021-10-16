import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig, ConfigFactory } from '@chainlink/types'
import { ethers } from 'ethers'

export const NAME = 'UNISWAP_V2'

export const ENV_RPC_URL = 'RPC_URL'
export const ENV_BLOCKCHAIN_NETWORK = 'BLOCKCHAIN_NETWORK'
export const ENV_ROUTER_CONTRACT = 'ROUTER_CONTRACT'

export const DEFAULT_ENDPOINT = 'crypto'
export const DEFAULT_BLOCKCHAIN_NETWORK = 'ethereum'
export const DEFAULT_ROUTER_CONTRACT = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
export const SUSHISWAP_ROUTER_CONTRACT = '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F'

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
    uniswapRouter: util.getEnv(ENV_ROUTER_CONTRACT, prefix) || DEFAULT_ROUTER_CONTRACT,
  }
}
