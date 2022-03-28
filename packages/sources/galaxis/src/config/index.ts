import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'GALAXIS'

export const DEFAULT_ENDPOINT = 'nba'
export const DEFAULT_EC_REGISTRY_ADDRESS = '0xf882B1A26Fc5C42005A055f7545150959dED27a8'
export const DEFAULT_CHAIN_BATCH_WRITE_ADAPTER_ADDRESS =
  '0xCF01E438E6bC82653a65273f215Ae5e5D19B1B33'
export const DEFAULT_EC_REGISTRY_MAP_ADDRESS = '0x7cdF091AF6a9ED75E3192500d3e5BB0f63e22Dea'

export interface ExtendedConfig extends Config {
  ecRegistryAddress: string
  ecRegistryMapAddress: string
  batchWriterAddress: string
  rpcUrl: string
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = util.getRequiredEnv('API_ENDPOINT', prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return {
    ...config,
    rpcUrl: util.getRequiredEnv('POLYGON_RPC_URL', prefix),
    ecRegistryAddress: util.getEnv('EC_REGISTRY_ADDRESS', prefix) || DEFAULT_EC_REGISTRY_ADDRESS,
    ecRegistryMapAddress:
      util.getEnv('EC_REGISTRY_MAP_ADDRESS', prefix) || DEFAULT_EC_REGISTRY_MAP_ADDRESS,
    batchWriterAddress:
      util.getEnv('CHAIN_BATCH_WRITE_ADAPTER_ADDRESS', prefix) ||
      DEFAULT_CHAIN_BATCH_WRITE_ADAPTER_ADDRESS,
  }
}
