import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'

export const NAME = 'ROCKET_POOL'

export const DEFAULT_ENDPOINT = 'reth'
/*
Note: if we know the addresses ahead of time, we could set up a map to the network provided
*/
export const DEFAULT_ETH_USD_PROXY_ADDRESS = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
export const DEFAULT_RETH_STORAGE_ADDRESS = '0xae78736Cd615f374D3085123A210448E74Fc6393'

export type RocketPoolConfig = Config & {
  provider: ethers.providers.JsonRpcProvider
}

export const makeConfig = (prefix?: string): RocketPoolConfig => {
  const ethereumRpcUrl = util.getRequiredEnv('ETHEREUM_RPC_URL')
  const ethereumRpcProvider = new ethers.providers.JsonRpcProvider(ethereumRpcUrl)

  const config = {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    provider: ethereumRpcProvider,
  }

  return config
}
