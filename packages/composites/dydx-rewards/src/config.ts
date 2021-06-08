import { RequestConfig } from '@chainlink/types'
import { ethers } from 'ethers'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_METHOD = 'poke'

export const ENV_PRIVATE_KEY = 'PRIVATE_KEY'
export const ENV_RPC_URL = 'RPC_URL'
export const ENV_REWARDS_ORACLE_ADDRESS = 'REWARDS_ORACLE_ADDRESS'

export type Config = {
  distributorAddress: string

  wallet: ethers.Wallet

  api: RequestConfig
}

export const makeConfig = (prefix?: string): Config => {
  const privateKey = util.getRequiredEnv(ENV_PRIVATE_KEY, prefix)
  const provider = new ethers.providers.JsonRpcProvider(util.getRequiredEnv(ENV_RPC_URL, prefix))
  const wallet = new ethers.Wallet(privateKey, provider)

  return {
    distributorAddress: util.getRequiredEnv(ENV_REWARDS_ORACLE_ADDRESS, prefix),
    wallet,
    api: {},
  }
}
