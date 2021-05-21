<<<<<<< HEAD
import { util } from '@chainlink/ea-bootstrap'

export type Config = {
  RPC_URL: string,
}

export const DEFAULT_RPC_URL = 'http://localhost:8545'
export const DEFAULT_ENDPOINT = 'format'

export const makeConfig = (): Config => {
    return {
        RPC_URL: util.getRequiredEnv('RPC_URL')
    }
}
=======
import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'difficulty'

// TODO: needs to setup config for underlying JSON-RPC adapter
export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)
>>>>>>> refactor(to refactor and update the old bob adapter): updated Bob adapter
