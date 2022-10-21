import { Requester, util } from '@chainlink/ea-bootstrap'
import { Config } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'
import rethAbi from '../abis/rethAbi.json'

export const NAME = 'ROCKET_POOL'

export const DEFAULT_ENDPOINT = 'reth'
export const DEFAULT_ETH_USD_PROXY_ADDRESS = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419'
export const RETH_TOKEN_CONTRACT = '0xae78736Cd615f374D3085123A210448E74Fc6393'

export type RocketPoolConfig = Config & {
  rethContract: ethers.Contract
}

export const makeConfig = (prefix?: string): RocketPoolConfig => {
  const ethereumRpcUrl = util.getRequiredEnv('ETHEREUM_RPC_URL')
  const rethProvider = new ethers.providers.JsonRpcProvider(ethereumRpcUrl)
  const rethContract = new ethers.Contract(RETH_TOKEN_CONTRACT, rethAbi, rethProvider)

  const config = {
    ...Requester.getDefaultConfig(prefix),
    defaultEndpoint: DEFAULT_ENDPOINT,
    rethContract,
  }

  return config
}
