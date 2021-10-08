import { RequestConfig } from '@chainlink/types'
import { ethers } from 'ethers'
import { util } from '@chainlink/ea-bootstrap'

export const DEFAULT_METHOD = 'poke'
export const DEFAULT_TREASURY_CLAIM_ADDRESS = '0x95EaBB0248D013b9F59c5D5256CE11b0a8140B54'
export const DEFAULT_TRADER_REWARDS_AMOUNT = '3835616e18'
export const DEFAULT_MARKET_MAKER_REWARDS_AMOUNT = '1150685e18'

export const ENV_PRIVATE_KEY = 'PRIVATE_KEY'
export const ENV_RPC_URL = 'RPC_URL'
export const ENV_TREASURY_CLAIM_ADDRESS = 'TREASURY_CLAIM_ADDRESS'
export const ENV_TRADER_REWARDS_AMOUNT = 'TRADER_REWARDS_AMOUNT'
export const ENV_MARKET_MAKER_REWARDS_AMOUNT = 'MARKET_MAKER_REWARDS_AMOUNT'

export type Config = {
  wallet: ethers.Wallet
  api: RequestConfig

  treasuryClaimAddress: string
  traderRewardsAmount: string
  marketMakerRewardsAmount: string
}

export const makeConfig = (prefix?: string): Config => {
  const privateKey = util.getRequiredEnv(ENV_PRIVATE_KEY, prefix)
  const provider = new ethers.providers.JsonRpcProvider(util.getRequiredEnv(ENV_RPC_URL, prefix))
  const wallet = new ethers.Wallet(privateKey, provider)

  return {
    api: {},
    wallet,
    treasuryClaimAddress:
      util.getEnv(ENV_TREASURY_CLAIM_ADDRESS, prefix) || DEFAULT_TREASURY_CLAIM_ADDRESS,
    traderRewardsAmount:
      util.getEnv(ENV_TRADER_REWARDS_AMOUNT, prefix) || DEFAULT_TRADER_REWARDS_AMOUNT,
    marketMakerRewardsAmount:
      util.getEnv(ENV_MARKET_MAKER_REWARDS_AMOUNT, prefix) || DEFAULT_MARKET_MAKER_REWARDS_AMOUNT,
  }
}
