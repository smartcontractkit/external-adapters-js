import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_ENDPOINT = 'conflux'
export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'
export const NAME = 'CONFLUX'

export type Config = {
  api: any
  rpcUrl: string
  networkId: number
  privateKey: string
}

export const makeConfig = (): Config => {
  return {
    api: {},
    rpcUrl: util.getRequiredEnvWithFallback(ENV_ETHEREUM_RPC_URL, [ENV_FALLBACK_RPC_URL]),
    networkId: Number(util.getRequiredEnv('NETWORK_ID')),
    privateKey: util.getRequiredEnv('PRIVATE_KEY'),
  }
}
