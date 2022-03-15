import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as DefaultConfig } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'price'

export const NAME = 'SAVAX_PRICE'

export const DEFAULT_SAVAX_ADDRESS = '0x2b2C81e08f1Af8835a78Bb2A90AE924ACE0eA4bE'
export const FLOATING_POINT_DECIMALS = 18

export interface Config extends DefaultConfig {
  sAvaxAddress: string
}

export const makeConfig = (prefix?: string): Config => {
  const sAvaxAddress = util.getEnv('SAVAX_ADDRESS', prefix) || DEFAULT_SAVAX_ADDRESS
  return {
    ...Requester.getDefaultConfig(),
    defaultEndpoint: DEFAULT_ENDPOINT,
    sAvaxAddress,
    rpcUrl: util.getRequiredEnv('AVALANCHE_RPC_URL', prefix),
  }
}
