import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'GALAXIS'

export const DEFAULT_ENDPOINT = 'nba'
export const DEFAULT_EC_REGISTRY_ADDRESS = '0x163883263274e8Ef6332cFa84F35B23c6C51dF72'
export const DEFAULT_CHAIN_BATCH_WRITE_ADAPTER_ADDRESS =
  '0xB57fba975C89492B016e0215E819B4d489F0fbcD'
export const DEFAULT_LIMIT_IN_BYTES = 700

export interface ExtendedConfig extends Config {
  ecRegistryAddress: string
  batchWriterAddress: string
  maxEncodedCallsBytes: number
  rpcUrl: string
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = util.getRequiredEnv('API_ENDPOINT', prefix)
  config.defaultEndpoint = DEFAULT_ENDPOINT
  const maxEncodedCallsBytes = util.getEnv('LIMIT', prefix)
  return {
    ...config,
    rpcUrl: util.getRequiredEnv('POLYGON_RPC_URL', prefix),
    ecRegistryAddress: util.getEnv('EC_REGISTRY_ADDRESS', prefix) || DEFAULT_EC_REGISTRY_ADDRESS,
    batchWriterAddress:
      util.getEnv('CHAIN_BATCH_WRITE_ADAPTER_ADDRESS', prefix) ||
      DEFAULT_CHAIN_BATCH_WRITE_ADAPTER_ADDRESS,
    maxEncodedCallsBytes: maxEncodedCallsBytes
      ? parseInt(maxEncodedCallsBytes)
      : DEFAULT_LIMIT_IN_BYTES,
  }
}
