import { util } from '@chainlink/ea-bootstrap'

export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'
export const ENV_ETHEREUM_CHAIN_ID = 'ETHEREUM_CHAIN_ID'
export const ENV_FALLBACK_CHAIN_ID = 'CHAIN_ID'
export const DEFAULT_CHAIN_ID = '1'
export const NAME = 'ETHWRITE'

export type Config = {
  rpcUrl: string
  network?: string
  chainId: string | number | undefined
  privateKey: string
  api: any
}

export const DEFAULT_ENDPOINT = 'txsend'

export const makeConfig = (): Config => {
  const rpcUrl = util.getRequiredEnvWithFallback(ENV_ETHEREUM_RPC_URL, [ENV_FALLBACK_RPC_URL])
  const chainId =
    parseInt(
      util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID]) || DEFAULT_CHAIN_ID,
    ) || util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID])
  return {
    api: {},
    rpcUrl,
    chainId,
    network: util.getEnv('NETWORK') || 'mainnet',
    privateKey: util.getRequiredEnv('PRIVATE_KEY'),
  }
}
