import { Requester, util } from '@chainlink/ea-bootstrap'
import * as types from '@chainlink/types'

export type Config = types.Config & {
  rpcUrl: string,
  wethContractAddress: string 
}

export const NAME = 'DX_DAO'

export const makeConfig = (prefix?: string): Config => {
  return {
    ...Requester.getDefaultConfig(prefix),
    rpcUrl: util.getRequiredEnv('RPC_URL'),
    wethContractAddress: util.getEnv('WETH_CONTRACT_ADDRESS') || "0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1"
  }
}
