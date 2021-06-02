import { util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const DEFAULT_RPC_URL = 'http://localhost:8545'
export const DEFAULT_ENDPOINT = 'format'

export const makeConfig = (): Config => {
    return {
        RPC_URL: util.getRequiredEnv('RPC_URL')
    }
}
