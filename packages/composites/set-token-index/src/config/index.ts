import { Requester, util } from '@chainlink/ea-bootstrap'
import * as types from '@chainlink/ea-bootstrap'

export const NAME = 'SET_TOKEN_INDEX'

export const DEFAULT_ENDPOINT = 'token-index'

export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'

export const ENV_ETHEREUM_CHAIN_ID = 'ETHEREUM_CHAIN_ID'
export const ENV_FALLBACK_CHAIN_ID = 'CHAIN_ID'
export const DEFAULT_CHAIN_ID = '1'

export type Config = types.Config & {
  rpcUrl: string
  network: string
}

export const makeConfig = (prefix?: string, network = 'mainnet'): Config => {
  const rpcUrl = util.getRequiredEnvWithFallback(
    ENV_ETHEREUM_RPC_URL,
    [ENV_FALLBACK_RPC_URL],
    prefix,
  )
  const chainId =
    parseInt(
      util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID]) || DEFAULT_CHAIN_ID,
    ) || util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID])
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl,
    chainId,

    network,
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
