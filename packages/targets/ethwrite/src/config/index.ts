import { util } from '@chainlink/ea-bootstrap'

export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'
export const NAME = 'ETHWRITE'

export type Config = {
  rpcUrl: string
  network?: string
  privateKey: string
  api: unknown
}

export const DEFAULT_ENDPOINT = 'txsend'

export const makeConfig = (): Config => {
  return {
    api: {},
    rpcUrl: util.getRequiredEnvWithFallback(ENV_ETHEREUM_RPC_URL, [ENV_FALLBACK_RPC_URL]),
    network: util.getEnv('NETWORK') || 'mainnet',
    privateKey: util.getRequiredEnv('PRIVATE_KEY'),
  }
}
