import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'STADER_LABS'
export const MATIC_AGGREGATOR_PROXY = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
export const MATICX_RATE_PROVIDER = '0xeE652bbF72689AA59F0B8F981c9c90e2A8Af8d8f'
export const DEFAULT_ENDPOINT = 'maticx'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL ||= util.getEnv('POLYGON_RPC_URL') || ''
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
