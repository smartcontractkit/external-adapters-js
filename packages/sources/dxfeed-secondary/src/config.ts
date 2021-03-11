import * as dxfeed from '@chainlink/dxfeed-adapter'
import { Config } from '@chainlink/types'

export const NAME = 'DXFEED_SECONDARY'

export const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix?: string): Config => dxfeed.makeConfig(prefix)
