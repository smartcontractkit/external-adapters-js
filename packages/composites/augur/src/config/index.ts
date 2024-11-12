import { Config as DefaultConfig } from '@chainlink/ea-bootstrap'
import { ethers } from 'ethers'
import { Requester, util } from '@chainlink/ea-bootstrap'

export type Config = DefaultConfig & {
  wallet: ethers.Wallet
}
export const ENV_ETHEREUM_CHAIN_ID = 'ETHEREUM_CHAIN_ID'
export const ENV_FALLBACK_CHAIN_ID = 'CHAIN_ID'
export const DEFAULT_CHAIN_ID = '1'

export const NAME = 'AUGUR'

export const makeConfig = (prefix?: string): Config => {
  const rpcUrl = util.getRequiredEnvWithFallback('ETHEREUM_RPC_URL', ['RPC_URL'], prefix)
  const chainId =
    parseInt(
      util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID]) || DEFAULT_CHAIN_ID,
    ) || util.getEnvWithFallback(ENV_ETHEREUM_CHAIN_ID, [ENV_FALLBACK_CHAIN_ID])
  const privateKey = util.getRequiredEnv('PRIVATE_KEY', prefix)
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl, chainId)
  const wallet = new ethers.Wallet(privateKey, provider)

  return {
    ...Requester.getDefaultConfig(prefix),
    verbose: true,
    wallet,
  }
}
