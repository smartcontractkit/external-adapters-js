import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const DEFAULT_ENDPOINT = 'example'

export const BASE_URL = 'https://api.paxos.com/v1/'

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)
