import { ChainType } from './endpoint'
import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const ENDPOINT_MAIN = 'https://sochain.com'

export const DEFAULT_DATA_PATH = 'addresses'
export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'balance'

export const getBaseURL = (): string => ENDPOINT_MAIN

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)
