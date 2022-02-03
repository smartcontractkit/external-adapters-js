import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig, ConfigFactory } from '@chainlink/types'

export const NAME = 'ALPINE'
export const ETH = 'ETHEREUM'
export const POLYGON = 'POLYGON'
export const DEFAULT_NETWORK = ETH
export type Config = BaseConfig & {
  ethereumRpcUrl: string
  polygonRpcUrl: string
}

export const makeConfig: ConfigFactory<Config> = (prefix?: string) => {
  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: 'tvl',
    ethereumRpcUrl: util.getEnv('ETHEREUM_RPC_URL') || '',
    polygonRpcUrl: util.getEnv('POLYGON_RPC_URL') || '',
  }
}
