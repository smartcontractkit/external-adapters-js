import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'GALAXIS'

export const DEFAULT_ENDPOINT = 'nba'
export const DEFAULT_BASE_URL = 'http://localhost:18081'
export const DEFAULT_EC_REGISTRY_ADDRESS = '0x163883263274e8Ef6332cFa84F35B23c6C51dF72'
export const DEFAULT_BATCH_WRITER_ADDRESS = '0xB57fba975C89492B016e0215E819B4d489F0fbcD'
export const DEFAULT_LIMIT_IN_BYTES = 250

export interface ExtendedConfig extends Config {
  ecRegistryAddress: string
  batchWriterAddress: string
  maxEncodedCallsBytes: number
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  const maxEncodedCallsBytes = util.getEnv('LIMIT', prefix)
  return {
    ...config,
    ecRegistryAddress: util.getEnv('EC_REGISTRY_ADDRESS', prefix) || DEFAULT_EC_REGISTRY_ADDRESS,
    batchWriterAddress: util.getEnv('BATCH_WRITER_ADDRESS', prefix) || DEFAULT_BATCH_WRITER_ADDRESS,
    maxEncodedCallsBytes: maxEncodedCallsBytes
      ? parseInt(maxEncodedCallsBytes)
      : DEFAULT_LIMIT_IN_BYTES,
  }
}
