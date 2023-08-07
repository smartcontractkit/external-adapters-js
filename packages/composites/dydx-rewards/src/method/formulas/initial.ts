import * as bn from 'bignumber.js'
import { BigNumber } from 'ethers'
import { AddressRewards, OracleRewardsData } from '../../ipfs-data'
import { addReward } from '../poke'

// We expect the amount with 2 decimal points, and the token has 18 decimals.
const rewardAmountToBigNumber = (amount: number): BigNumber =>
  BigNumber.from(amount * 100).mul(BigNumber.from(10).pow(16))

// Retroactive tiers are sorted descending to make it easier to find the highest applicable tier
const retroactiveTiers = [
  {
    min: 1_000_000,
    reward: rewardAmountToBigNumber(9529.86),
    volumeRequirement: 100_000,
  },
  {
    min: 100_000,
    reward: rewardAmountToBigNumber(6413.91),
    volumeRequirement: 50_000,
  },
  {
    min: 10_000,
    reward: rewardAmountToBigNumber(4349.63),
    volumeRequirement: 5_000,
  },
  {
    min: 1,
    reward: rewardAmountToBigNumber(1163.51),
    volumeRequirement: 500,
  },
  {
    min: 0,
    reward: rewardAmountToBigNumber(310.75),
    volumeRequirement: 1,
  },
]

// Retroactive rewards is 75M (hard-coded, as the above tiers would have to change if this was changed)
const totalRetroactiveRewards = BigNumber.from(75_000_000).mul(BigNumber.from(10).pow(18))

const findRetroactiveRewardsTier = (tradeVolume: number | boolean) => {
  // Do a strict check to avoid catching "0" - which is treated differently
  if (tradeVolume === false) {
    return {
      min: 0,
      reward: BigNumber.from(0),
      volumeRequirement: 1,
    }
  }

  const tier = retroactiveTiers.find(({ min }) => (tradeVolume as number) >= min)
  if (!tier) {
    throw new Error(`Unable to find tier for volume: ${tradeVolume}`)
  }

  return tier
}

const EXPO_BONUS_TOKENS = rewardAmountToBigNumber(565.61)

export const calcRetroactiveRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  treasuryClaimAddress: string,
): void => {
  const combinedAddresses = [
    ...Object.keys(epochData.retroactiveTradeVolume || {}),
    ...Object.keys(epochData.isExpoUser || {}),
  ]
  const uniqueAddresses = [...new Set(combinedAddresses)]

  let sumRetroactivelyDistributedRewards = BigNumber.from(0)

  for (const addr of uniqueAddresses) {
    const volume = epochData.tradeVolume?.[addr] || 0
    const retroactiveVolume = epochData.retroactiveTradeVolume?.[addr] ?? false
    const tier = findRetroactiveRewardsTier(retroactiveVolume)
    const isExpoUser = epochData.isExpoUser?.[addr] || false
    const userPotentialRewardTokens = tier.reward.add(isExpoUser ? EXPO_BONUS_TOKENS : 0)
    const earnedFraction = bn.BigNumber.min(1, new bn.BigNumber(volume).div(tier.volumeRequirement))
    const userRetroactiveRewardTokens = new bn.BigNumber(userPotentialRewardTokens.toString())
      .times(earnedFraction)
      .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
      .toFixed()
    if (userRetroactiveRewardTokens != '0') {
      addReward(addressRewards, addr, userRetroactiveRewardTokens)
      sumRetroactivelyDistributedRewards = sumRetroactivelyDistributedRewards.add(
        userRetroactiveRewardTokens,
      )
    }
  }

  // If there are tokens not claimed (by users not reaching volume requirements), send them to the
  // treasury's merkle root claim contract.
  const totalForfeitedTokens = totalRetroactiveRewards.sub(sumRetroactivelyDistributedRewards)
  if (!totalForfeitedTokens.isZero()) {
    addReward(addressRewards, treasuryClaimAddress, totalForfeitedTokens)
  }
}

export const calcTraderRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  traderRewardsAmount: bn.BigNumber,
  traderScoreAlpha: number,
): void => {
  const F = Object.keys(epochData.tradeFeesPaid).reduce(
    (sum, addr) => sum.plus(epochData.tradeFeesPaid[addr]),
    new bn.BigNumber(0),
  )
  const G = Object.keys(epochData.openInterest).reduce(
    (sum, addr) => sum.plus(epochData.openInterest[addr]),
    new bn.BigNumber(0),
  )

  const traderScore: { [address: string]: bn.BigNumber } = {}
  let traderScoreSum = new bn.BigNumber(0)

  Object.keys(epochData.tradeFeesPaid).forEach((addr) => {
    const f = epochData.tradeFeesPaid[addr]
    const g = epochData.openInterest[addr] || 0
    const score = new bn.BigNumber((f / F.toNumber()) ** traderScoreAlpha).times(
      (g / G.toNumber()) ** (1 - traderScoreAlpha),
    )

    traderScore[addr] = score
    traderScoreSum = traderScoreSum.plus(score)
  })

  Object.keys(traderScore).forEach((addr) => {
    const reward = traderRewardsAmount
      .times(traderScore[addr])
      .div(traderScoreSum)
      .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
      .toFixed()
    if (reward !== '0') {
      addReward(addressRewards, addr, reward)
    }
  })
}

export const calcMarketMakerRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  marketMakerRewardsAmount: bn.BigNumber,
): void => {
  const quoteScoreSum = Object.keys(epochData.quoteScore).reduce(
    (sum, addr) => sum.plus(epochData.quoteScore[addr]),
    new bn.BigNumber(0),
  )

  Object.keys(epochData.quoteScore).forEach((addr) => {
    const addressToGiveRewardsTo =
      ('linkedPrimaryAddresses' in epochData && epochData.linkedPrimaryAddresses?.[addr]) || addr
    const reward = marketMakerRewardsAmount
      .times(epochData.quoteScore[addr])
      .div(quoteScoreSum)
      .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
      .toFixed()
    if (reward !== '0') {
      addReward(addressRewards, addressToGiveRewardsTo, reward)
    }
  })
}
