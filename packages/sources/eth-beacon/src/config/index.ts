import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'ETH_BEACON'

export const DEFAULT_ENDPOINT = 'balance'
export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'
export const ENV_BATCH_SIZE = 'BATCH_SIZE'

export const DEFAULT_BATCH_SIZE = 15

export const makeConfig = (prefix?: string): Config => {
  const rpcURL = util.getRequiredEnvWithFallback(
    ENV_ETHEREUM_RPC_URL,
    [ENV_FALLBACK_RPC_URL],
    prefix,
  )
  const batchSize = parseInt(util.getEnv(ENV_BATCH_SIZE, prefix) || '') || DEFAULT_BATCH_SIZE
  const defaultConfig = Requester.getDefaultConfig(prefix)
  return {
    ...defaultConfig,
    api: {
      ...defaultConfig.api,
      baseURL: rpcURL,
    },
    defaultEndpoint: DEFAULT_ENDPOINT,
    adapterSpecificParams: {
      batchSize: batchSize,
    },
  }
}
