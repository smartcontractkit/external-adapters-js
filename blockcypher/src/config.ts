import { Requester } from '@chainlink/external-adapter'
import { ConfigFactory } from '@chainlink/types'

export const DEFAULT_DATA_PATH = 'result'
export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'balance'

export const makeConfig: ConfigFactory = (prefix?) => Requester.getDefaultConfig(prefix)
