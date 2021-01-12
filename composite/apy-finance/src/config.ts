import types from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export type Config = types.Config & {
  rpcUrl: string
  addressRegistry: string
}

export const makeConfig = (): Config => {
  const rpcUrl = util.getRequiredEnv('RPC_URL')
  const addressRegistry = util.getRequiredEnv('REGISTRY_ADDRESS')

  return { rpcUrl, addressRegistry }
}
