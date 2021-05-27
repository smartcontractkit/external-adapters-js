import { Requester, util } from '@chainlink/ea-bootstrap'
import * as types from '@chainlink/types'

export type Config = types.Config & {
  rpcUrl: string
  controllerAddress: string
}

export const DEFAULT_CONTROLLER_ADDRESS = '0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnv('RPC_URL', prefix),
    controllerAddress: util.getEnv('CONTROLLER_ADDRESS') || DEFAULT_CONTROLLER_ADDRESS
  }
}
