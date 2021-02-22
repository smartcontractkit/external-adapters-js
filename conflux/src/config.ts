import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_ENDPOINT = 'conflux'

export type Config = {
  api: object,
  rpcUrl: string
  networkId: number
  privateKey: string
}

export const makeConfig = (): Config => {
  return {
    api: {},
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    networkId: util.getRequiredEnv('NETWORK_ID'),
    privateKey: util.getRequiredEnv('PRIVATE_KEY'),
  }
}
