import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig, ConfigFactory } from '@chainlink/ea-bootstrap'

export const NAME = 'ALPINE'
export const ETH = 'ETHEREUM'
export const POLYGON = 'POLYGON'
export const DEFAULT_NETWORK = ETH
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
    ethereumRpcUrl: util.getEnv('ETHEREUM_RPC_URL') || '',
    polygonRpcUrl: util.getEnv('POLYGON_RPC_URL') || '',
    ethereumChainId:
      parseInt(util.getEnv('ETHEREUM_CHAIN_ID') || '1') || util.getEnv('ETHEREUM_CHAIN_ID'),
    polygonChainId:
      parseInt(util.getEnv('POLYGON_CHAIN_ID') || '137') || util.getEnv('POLYGON_CHAIN_ID'),
  }
}
