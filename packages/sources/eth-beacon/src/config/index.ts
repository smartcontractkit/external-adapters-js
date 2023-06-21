import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'

export const NAME = 'ETH_BEACON'

export const DEFAULT_ENDPOINT = 'balance'
export const ENV_ETH_CONSENSUS_RPC_URL = 'ETH_CONSENSUS_RPC_URL'
export const ENV_ETH_EXECUTION_RPC_URL = 'ETH_EXECUTION_RPC_URL'
export const ENV_FALLBACK_ETH_CONSENSUS_RPC_URLS = ['RPC_URL', 'ETHEREUM_RPC_URL']
export const ENV_BATCH_SIZE = 'BATCH_SIZE'
export const ENV_GROUP_SIZE = 'GROUP_SIZE'
export const ENV_CHAIN_ID = 'CHAIN_ID'

export const DEFAULT_BATCH_SIZE = 15
export const DEFAULT_GROUP_SIZE = 15
export const DEFAULT_CHAIN_ID = 1

export const makeConfig = (prefix?: string): Config => {
  const beaconRpcUrl = util.getRequiredEnvWithFallback(
    ENV_ETH_CONSENSUS_RPC_URL,
    ENV_FALLBACK_ETH_CONSENSUS_RPC_URLS,
    prefix,
  )
  const executionRpcUrl = util.getEnv(ENV_ETH_EXECUTION_RPC_URL) || ''
  const batchSize = Number(util.getEnv(ENV_BATCH_SIZE, prefix) ?? DEFAULT_BATCH_SIZE)
  const groupSize = Number(util.getEnv(ENV_GROUP_SIZE, prefix) || DEFAULT_GROUP_SIZE)
  const chainId = Number(util.getEnv(ENV_CHAIN_ID, prefix) || DEFAULT_CHAIN_ID)
  const defaultConfig = Requester.getDefaultConfig(prefix)
  return {
    ...defaultConfig,
    api: {
      ...defaultConfig.api,
      baseURL: beaconRpcUrl,
    },
    defaultEndpoint: DEFAULT_ENDPOINT,
    adapterSpecificParams: {
      beaconRpcUrl,
      executionRpcUrl,
      batchSize,
      groupSize,
      chainId,
    },
  }
}
