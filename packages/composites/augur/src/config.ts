import { Config as DefaultConfig } from '@chainlink/types'
import { ethers } from 'ethers'
import { Requester, util } from '@chainlink/ea-bootstrap'

export type Config = DefaultConfig & {
  wallet: ethers.Wallet
}

export const makeConfig = (prefix?: string): Config => {
  const rpcUrl = util.getRequiredEnv('RPC_URL', prefix)
  const privateKey = util.getRequiredEnv('PRIVATE_KEY', prefix)
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const wallet = new ethers.Wallet(privateKey, provider)
	console.log(rpcUrl);
console.log(privateKey);
  return {
    ...Requester.getDefaultConfig(prefix),
    verbose: true,
    wallet,
  }
}
