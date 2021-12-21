import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig, ConfigFactory } from '@chainlink/types'
import { ethers } from 'ethers'

export const NAME = 'PANCAKESWAP'

export const ENV_RPC_URL = 'RPC_URL'
export const ENV_ADDRESS_PROVIDER = 'ADDRESS_PROVIDER'
export const ENV_BLOCKCHAIN_NETWORK = 'BLOCKCHAIN_NETWORK'

export const DEFAULT_BLOCKCHAIN_NETWORK = 'bsc'
export const DEFAULT_ENDPOINT = 'crypto'
export const ROUTER_CONTRACT = '0x10ED43C718714eb63d5aA57B78B54704E256024E'

export type Config = BaseConfig & {
  provider: ethers.providers.Provider
}

export const makeConfig: ConfigFactory<Config> = (prefix) => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    network: util.getEnv(ENV_BLOCKCHAIN_NETWORK, prefix) || DEFAULT_BLOCKCHAIN_NETWORK,
    provider: new ethers.providers.JsonRpcProvider(util.getRequiredEnv(ENV_RPC_URL, prefix)),
  }
}
