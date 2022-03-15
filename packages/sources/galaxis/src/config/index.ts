import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'GALAXIS'

export const DEFAULT_ENDPOINT = 'nba'
export const DEFAULT_BASE_URL = 'http://localhost:18081'
export const DEFAULT_EC_REGISTRY_ADDRESS = ''
export const DEFAULT_BASE_WRITER_ADDRESS = ''

export interface ExtendedConfig extends Config {
  ecRegistryAddress: string
  batchWriterAddress: string
  limit?: number
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  const limit = util.getEnv('LIMIT', prefix)
  return {
    ...config,
    ecRegistryAddress: util.getEnv('EC_REGISTRY_ADDRESS', prefix) || DEFAULT_EC_REGISTRY_ADDRESS,
    batchWriterAddress: util.getEnv('BATCH_WRITER_ADDRESS', prefix) || DEFAULT_BASE_WRITER_ADDRESS,
    limit: limit ? parseInt(limit) : undefined,
  }
}
