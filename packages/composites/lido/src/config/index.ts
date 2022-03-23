import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'exchangerate'
export const NAME = 'LIDO'
export const DEFAULT_WSTETH_ADDRESS = '0x7f39c581f595b53c5cb19bd0b3f8da6c935e2ca0'
export const FLOATING_POINT_DECIMALS = 18

export interface Config extends DefaultConfig {
  wstEthAddress: string
}

export const makeConfig = (prefix?: string): Config => {
  const wstEthAddress = util.getEnv('WSTETH_ADDRESS', prefix) || DEFAULT_WSTETH_ADDRESS
  return {
    ...Requester.getDefaultConfig(),
    wstEthAddress,
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
