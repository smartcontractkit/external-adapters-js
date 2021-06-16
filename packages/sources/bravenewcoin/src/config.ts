import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'BRAVENEWCOIN'

export const DEFAULT_ENDPOINT = 'price'

export const makeConfig = (prefix = ''): Config => {
    const config = Requester.getDefaultConfig(prefix, true)
    config.DEFAULT_ENDPOINT = DEFAULT_ENDPOINT
    return config
  }
