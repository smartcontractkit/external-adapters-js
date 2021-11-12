import { util } from '@chainlink/ea-bootstrap'

export const NAME = 'DEFI_PULSE'

export type Config = {
  rpcUrl: string
  network: string
}

export const makeConfig = (network = 'mainnet'): Config => {
  return {
    rpcUrl: util.getRequiredEnvWithFallback('ETHEREUM_RPC_URL', ['RPC_URL']),
    network,
  }
}
