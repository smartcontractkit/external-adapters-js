import { Requester, util } from '@chainlink/ea-bootstrap'
import * as types from '@chainlink/types'

export const NAME = 'SET_TOKEN_INDEX'

export const DEFAULT_ENDPOINT = 'token-index'

export type Config = types.Config & {
  rpcUrl: string
  network: string
}

export const makeConfig = (prefix?: string, network = 'mainnet'): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnv('RPC_URL', prefix),
    network,
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
