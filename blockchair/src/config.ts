import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'

export const ENDPOINT_MAIN = 'https://api.blockchair.com'

export const DEFAULT_DATA_PATH = 'addresses'
export const DEFAULT_CONFIRMATIONS = 6
export const DEFAULT_ENDPOINT = 'difficulty'

export const getBaseURL = (): string => ENDPOINT_MAIN

export const getConfig = (): Config => Requester.getDefaultConfig()
