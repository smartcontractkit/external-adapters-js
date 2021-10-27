import { util } from '@chainlink/ea-bootstrap'

export type Config = {
  rpcUrl: string
  registryAddr: string
}

export const makeConfig = (): Config => {
  return {
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    registryAddr: util.getRequiredEnv('REGISTRY_ADDRESS'),
  }
}
