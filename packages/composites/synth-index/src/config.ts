import { util } from '@chainlink/ea-bootstrap'
import * as ta from '@chainlink/token-allocation-adapter'

export type Config = {
  defaultNetwork: string
  taConfig: ta.types.Config
}

export const makeConfig = (prefix = ''): Config => {
  return {
    defaultNetwork: util.getEnv('DEFAULT_NETWORK') || 'mainnet',
    taConfig: ta.makeConfig(prefix),
  }
}
