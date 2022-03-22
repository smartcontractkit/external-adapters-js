import { RequestConfig, Config } from '@chainlink/types'
import { ethers } from 'ethers'
import { Requester, util } from '@chainlink/ea-bootstrap'

export const DEFAULT_METHOD = 'poke'
export const DEFAULT_ENDPOINT = 'rewards'
export const DEFAULT_TREASURY_CLAIM_ADDRESS = '0x95EaBB0248D013b9F59c5D5256CE11b0a8140B54'
export const DEFAULT_TRADER_REWARDS_AMOUNT = '3835616e18'
export const DEFAULT_MARKET_MAKER_REWARDS_AMOUNT = '1150685e18'
export const NAME = 'DYDX_REWARDS'

export const ENV_PRIVATE_KEY = 'PRIVATE_KEY'
export const ENV_ETHEREUM_RPC_URL = 'ETHEREUM_RPC_URL'
export const ENV_FALLBACK_RPC_URL = 'RPC_URL'
export const ENV_TREASURY_CLAIM_ADDRESS = 'TREASURY_CLAIM_ADDRESS'
export const ENV_TRADER_REWARDS_AMOUNT = 'TRADER_REWARDS_AMOUNT'
export const ENV_MARKET_MAKER_REWARDS_AMOUNT = 'MARKET_MAKER_REWARDS_AMOUNT'
export const ENV_TRADER_SCORE_A = 'TRADER_SCORE_A'
export const ENV_TRADER_SCORE_B = 'TRADER_SCORE_B'
export const ENV_TRADER_SCORE_C = 'TRADER_SCORE_C'

export interface ExtendedConfig extends Config {
  wallet: ethers.Wallet
  api: RequestConfig

  treasuryClaimAddress: string
  traderRewardsAmount: string
  marketMakerRewardsAmount: string

  traderScoreA?: string
  traderScoreB?: string
  traderScoreC?: string
}

export const makeConfig = (prefix?: string): ExtendedConfig => {
  const privateKey = util.getRequiredEnv(ENV_PRIVATE_KEY, prefix)
  const provider = new ethers.providers.JsonRpcProvider(
    util.getRequiredEnvWithFallback(ENV_ETHEREUM_RPC_URL, [ENV_FALLBACK_RPC_URL], prefix),
  )
  const wallet = new ethers.Wallet(privateKey, provider)

  return {
    ...Requester.getDefaultConfig(prefix),
    api: {},
    wallet,
    treasuryClaimAddress:
      util.getEnv(ENV_TREASURY_CLAIM_ADDRESS, prefix) || DEFAULT_TREASURY_CLAIM_ADDRESS,
    traderRewardsAmount:
      util.getEnv(ENV_TRADER_REWARDS_AMOUNT, prefix) || DEFAULT_TRADER_REWARDS_AMOUNT,
    marketMakerRewardsAmount:
      util.getEnv(ENV_MARKET_MAKER_REWARDS_AMOUNT, prefix) || DEFAULT_MARKET_MAKER_REWARDS_AMOUNT,
    traderScoreA: util.getEnv(ENV_TRADER_SCORE_A),
    traderScoreB: util.getEnv(ENV_TRADER_SCORE_B),
    traderScoreC: util.getEnv(ENV_TRADER_SCORE_C),
    defaultEndpoint: DEFAULT_ENDPOINT,
  }
}
