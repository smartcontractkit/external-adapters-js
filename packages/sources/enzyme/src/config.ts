import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config as BaseConfig } from '@chainlink/types'
import { ethers } from 'ethers'

export const NAME = 'ENZYME'

export const ENV_RPC_URL = 'RPC_URL'

export const DEFAULT_ENDPOINT = 'calcNav'

export type Config = BaseConfig & {
  provider: ethers.providers.Provider
}

export const makeConfig = (prefix?: string): Config => {
  const rpcURL = util.getRequiredEnv(ENV_RPC_URL, prefix)

  return {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    provider: new ethers.providers.JsonRpcProvider(rpcURL),
  }
}
