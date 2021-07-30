import { util } from '@chainlink/ea-bootstrap'
import * as ta from '@chainlink/token-allocation-adapter'
import { Config as BaseConfig } from '@chainlink/types'

export interface Config extends BaseConfig {
  defaultNetwork: string
  taConfig: ta.types.Config
}

export const makeConfig = (prefix = ''): Config => {
  return {
    api: {},
    defaultNetwork: util.getEnv('DEFAULT_NETWORK') || 'mainnet',
    taConfig: ta.makeConfig(prefix),
  }
}
