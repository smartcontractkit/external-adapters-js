import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'conversion'

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)
