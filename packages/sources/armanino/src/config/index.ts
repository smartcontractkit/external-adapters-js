import { Requester } from '@chainlink/ea-bootstrap'
import type { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'ARMANINO'

export const DEFAULT_ENDPOINT = 'mco2'
export const DEFAULT_BASE_URL = 'https://api.real-time-attest.trustexplorer.io/chainlink'

export const makeConfig = (prefix?: string): Config => {
  const config = Requester.getDefaultConfig(prefix)
  config.api.baseURL = config.api.baseURL || DEFAULT_BASE_URL
  config.defaultEndpoint = DEFAULT_ENDPOINT
  return config
}
