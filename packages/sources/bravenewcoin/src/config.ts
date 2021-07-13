import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'BRAVENEWCOIN'

export const DEFAULT_ENDPOINT = 'crypto'

export const makeConfig = (prefix = ''): Config => {
    const config = Requester.getDefaultConfig(prefix)
    config.defaultEndpoint = DEFAULT_ENDPOINT
    return config
  }
