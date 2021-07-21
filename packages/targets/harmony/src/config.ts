import { Requester, util } from '@chainlink/ea-bootstrap'
import types from '@chainlink/types'

export const DEFAULT_API_ENDPOINT = 'https://api.s0.t.hmny.io'
export const DEFAULT_CHAIN_ID = 1
export const DEFAULT_GAS_LIMIT = 6721900

const ENV_PRIVATE_KEY = 'PRIVATE_KEY'
const ENV_CHAIN_ID = 'CHAIN_ID'
const ENV_GAS_LIMIT = 'GAS_LIMIT'

export type Config = types.Config & {
  privateKey: string
  chainID: string
  gasLimit: string
}

export const makeConfig = (prefix?: string): Config => {
  const defaultConfig = Requester.getDefaultConfig(prefix)
  defaultConfig.api.baseURL = defaultConfig.api.baseURL || DEFAULT_API_ENDPOINT
  return {
    ...defaultConfig,
    privateKey: util.getRequiredEnv(ENV_PRIVATE_KEY, prefix),
    chainID: util.getEnv(ENV_CHAIN_ID, prefix) || `${DEFAULT_CHAIN_ID}`,
    gasLimit: util.getEnv(ENV_GAS_LIMIT, prefix) || `${DEFAULT_GAS_LIMIT}`,
  }
}
