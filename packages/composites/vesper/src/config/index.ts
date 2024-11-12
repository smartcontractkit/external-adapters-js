import { Requester, util } from '@chainlink/ea-bootstrap'
import * as types from '@chainlink/ea-bootstrap'

export type Config = types.Config & {
  rpcUrl: string
  controllerAddress: string
}

export const NAME = 'VESPER'
export const DEFAULT_CONTROLLER_ADDRESS = '0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217'
export const DEFAULT_ENDPOINT = 'tvl'

export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'

export const ENV_ETHEREUM_CHAIN_ID = 'ETHEREUM_CHAIN_ID'
export const ENV_FALLBACK_CHAIN_ID = 'CHAIN_ID'
export const DEFAULT_CHAIN_ID = '1'

export const makeConfig: types.ConfigFactory<Config> = (prefix) => {
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
    controllerAddress: util.getEnv('CONTROLLER_ADDRESS') || DEFAULT_CONTROLLER_ADDRESS,
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
