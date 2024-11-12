import { Requester, util } from '@chainlink/ea-bootstrap'
import type { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'LIDO'
export const ENV_POLYGON_RPC_URL = 'POLYGON_RPC_URL'
export const ENV_POLYGON_CHAIN_ID = 'POLYGON_CHAIN_ID'
export const DEFAULT_CHAIN_ID = '137'
export const MATIC_AGGREGATOR_PROXY = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
export const STMATIC_RATE_PROVIDER = '0xdEd6C522d803E35f65318a9a4d7333a22d582199'
export const DEFAULT_ENDPOINT = 'stmatic'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL ||= util.getEnv(ENV_POLYGON_RPC_URL) || ''
  config.chainId =
    parseInt(util.getEnv(ENV_POLYGON_CHAIN_ID) || DEFAULT_CHAIN_ID) ||
    util.getEnv(ENV_POLYGON_CHAIN_ID)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
