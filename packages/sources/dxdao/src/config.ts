import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'DX_DAO'

export const JSON_RPC_URL = util.getRequiredEnv('RPC_URL')

export const makeConfig = (prefix?: string): Config => {
  return Requester.getDefaultConfig(prefix)
}
