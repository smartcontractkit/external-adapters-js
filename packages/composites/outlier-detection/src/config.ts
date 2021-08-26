import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const DEFAULT_CHECK_THRESHOLD = 0
export const DEFAULT_ONCHAIN_THRESHOLD = 0

export const makeConfig = (prefix = ''): Config => Requester.getDefaultConfig(prefix)
