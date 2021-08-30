import { RequestConfig } from '@chainlink/types'
import { ethers } from 'ethers'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_METHOD = 'poke'
export const DEFAULT_TREASURY_CLAIM_ADDRESS = '0x95EaBB0248D013b9F59c5D5256CE11b0a8140B54'

export const ENV_PRIVATE_KEY = 'PRIVATE_KEY'
export const ENV_RPC_URL = 'RPC_URL'
export const ENV_TREASURY_CLAIM_ADDRESS = 'TREASURY_CLAIM_ADDRESS'

export type Config = {
  wallet: ethers.Wallet
  treasuryClaimAddress: string
  api: RequestConfig
}

export const makeConfig = (prefix?: string): Config => {
  const privateKey = util.getRequiredEnv(ENV_PRIVATE_KEY, prefix)
  const provider = new ethers.providers.JsonRpcProvider(util.getRequiredEnv(ENV_RPC_URL, prefix))
  const wallet = new ethers.Wallet(privateKey, provider)

  return {
    wallet,
    treasuryClaimAddress:
      util.getEnv(ENV_TREASURY_CLAIM_ADDRESS, prefix) || DEFAULT_TREASURY_CLAIM_ADDRESS,
    api: {},
  }
}
