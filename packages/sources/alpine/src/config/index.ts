import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig, ConfigFactory } from '@chainlink/ea-bootstrap'

export const NAME = 'ALPINE'
export const ETH = 'ETHEREUM'
export const POLYGON = 'POLYGON'
export const DEFAULT_NETWORK = ETH
export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_POLYGON_RPC_URL = 'POLYGON_RPC_URL'
export const ENV_ETHEREUM_CHAIN_ID = 'ETHEREUM_CHAIN_ID'
export const ENV_POLYGON_CHAIN_ID = 'POLYGON_CHAIN_ID'
export const DEFAULT_ETH_CHAIN_ID = '1'
export const DEFAULT_POLYGON_CHAIN_ID = '137'
export type Config = BaseConfig & {
  ethereumRpcUrl: string
  polygonRpcUrl: string
  ethereumChainId: number | string | undefined
  polygonChainId: number | string | undefined
}

export const makeConfig: ConfigFactory<Config> = (prefix?: string) => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: 'tvl',
    ethereumRpcUrl: util.getEnv(ENV_ETHEREUM_RPC_URL) || '',
    polygonRpcUrl: util.getEnv(ENV_POLYGON_RPC_URL) || '',
    ethereumChainId:
      parseInt(util.getEnv(ENV_ETHEREUM_CHAIN_ID) || DEFAULT_ETH_CHAIN_ID) ||
      util.getEnv(ENV_ETHEREUM_CHAIN_ID),
    polygonChainId:
      parseInt(util.getEnv(ENV_POLYGON_CHAIN_ID) || DEFAULT_POLYGON_CHAIN_ID) ||
      util.getEnv(ENV_POLYGON_CHAIN_ID),
  }
}
