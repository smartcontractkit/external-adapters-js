import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_INTERVAL = '1min'
export const DEFAULT_LIMIT = 1
export const DEFAULT_ENDPOINT = 'eod'

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)
