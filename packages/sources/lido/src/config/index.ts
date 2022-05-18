import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'LIDO'
export const MATIC_AGGREGATOR_PROXY = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
export const STMATIC_RATE_PROVIDER = '0xdEd6C522d803E35f65318a9a4d7333a22d582199'
export const DEFAULT_ENDPOINT = 'stmatic'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL ||= util.getEnv('POLYGON_RPC_URL') || ''
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
