import { Requester } from '@chainlink/external-adapter'
import { util } from '@chainlink/ea-bootstrap'

export type Config = {
  rpcUrl: string
  network: string
  privateKey: string
  api: any
}

export const DEFAULT_ENDPOINT = 'txsend'

export const makeConfig = (): Config => {
  return {
    api: {},
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    network: util.getEnv('NETWORK') || 'mainnet',
    privateKey: util.getRequiredEnv('PRIVATE_KEY'),
  }
}
