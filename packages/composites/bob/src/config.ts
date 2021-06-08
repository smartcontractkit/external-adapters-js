import { util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export interface ExtendedConfig extends Config {
  RPC_URL: string;
}

export const DEFAULT_RPC_URL = 'http://localhost:8545'
export const DEFAULT_ENDPOINT = 'format'

export const makeConfig = (): ExtendedConfig => {
    return {
        RPC_URL: util.getEnv('RPC_URL')
    }
}
