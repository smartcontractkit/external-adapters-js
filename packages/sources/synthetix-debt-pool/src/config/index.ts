import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'SYNTHETIX_DEBT_POOL'

export const DEFAULT_ENDPOINT = 'debt'

export enum SUPPORTED_CHAINS {
  ETHEREUM = 0,
  OPTIMISM = 1,
}

export const makeConfig = (prefix?: string): Config => {
  return Requester.getDefaultConfig(prefix)
}
