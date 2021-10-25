import { Requester } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/types'

export const NAME = 'WRAPPED_POR'
export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)
