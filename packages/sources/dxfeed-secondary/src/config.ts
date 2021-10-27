import * as dxfeed from '@chainlink/dxfeed-adapter'
import { Config } from '@chainlink/types'

export const NAME = 'DXFEED_SECONDARY'

export const makeConfig = (prefix?: string): Config => {
  const baseConfig = dxfeed.makeConfig(prefix)
  baseConfig.name = NAME
  return baseConfig
}
