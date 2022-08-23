import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'STADER_LABS'
export const DEFAULT_ENDPOINT = 'maticx'

export const MATIC_AGGREGATOR_PROXY = '0xAB594600376Ec9fD91F8e885dADF0CE036862dE0'
export const MATICX_RATE_PROVIDER = '0xeE652bbF72689AA59F0B8F981c9c90e2A8Af8d8f'
export const FANTOM_AGGREGATOR_PROXY = '0xf4766552d15ae4d256ad41b6cf2933482b0680dc'
export const SFTMX_RATE_PROVIDER = '0xb458bfc855ab504a8a327720fcef98886065529b'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  config.adapterSpecificParams = {
    polygonRpcUrl: util.getEnv('POLYGON_RPC_URL') || '',
    fantomRpcUrl: util.getEnv('FANTOM_RPC_URL') || '',
  }
  return config
}
