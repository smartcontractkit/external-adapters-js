import { util } from '@chainlink/ea-bootstrap'

export type Config = {
  rpcUrl: string
  network: string
}

export const makeConfig = (network = 'mainnet'): Config => {
  return {
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    network,
  }
}
