import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)
