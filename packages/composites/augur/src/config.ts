import { Config as DefaultConfig } from '@chainlink/types'
import { ethers } from 'ethers'
import { HTTP, util } from '@chainlink/ea-bootstrap'

export type Config = DefaultConfig & {
  wallet: ethers.Wallet
}

export const makeConfig = (prefix?: string): Config => {
  const rpcUrl = util.getRequiredEnvWithFallback('ETHEREUM_RPC_URL', ['RPC_URL'], prefix)
  const privateKey = util.getRequiredEnv('PRIVATE_KEY', prefix)
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)

  return {
    ...HTTP.getDefaultConfig(prefix),
    verbose: true,
    wallet,
  }
}
