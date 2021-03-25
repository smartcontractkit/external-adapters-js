import { Requester } from '@chainlink/ea-bootstrap'
import { ConfigFactory } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'balance'

export const makeConfig: ConfigFactory = (prefix?) => Requester.getDefaultConfig(prefix)
