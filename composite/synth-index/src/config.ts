import { util } from '@chainlink/ea-bootstrap'

export type Config = {
  defaultNetwork: string
}

export const makeConfig = (): Config => {
  return {
    defaultNetwork: util.getEnv('DEFAULT_NETWORK') || 'mainnet',
  }
}
