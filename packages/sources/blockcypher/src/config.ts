import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'BLOCKCYPHER'

export const DEFAULT_ENDPOINT = 'balance'

export const makeConfig = (prefix = ''): Config => {
    const config = Requester.getDefaultConfig(prefix, true)
    config.defaultEndpoint = DEFAULT_ENDPOINT
    return config
}
