import { util } from '@chainlink/ea-bootstrap'

export type Config = {
  defaultNetwork: string
  dataProvider: string
}

export const makeConfig = (dataProvider = ''): Config => {
  return {
    defaultNetwork: util.getEnv('DEFAULT_NETWORK') || 'mainnet',
    dataProvider,
  }
}
