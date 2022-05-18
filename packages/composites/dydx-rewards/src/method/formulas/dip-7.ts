import * as bn from 'bignumber.js'
import { AddressRewards, OracleRewardsData } from '../../ipfs-data'
import { addReward } from '../poke'

export const calcTraderRewards = (
  epochData: OracleRewardsData,
  addressRewards: AddressRewards,
  traderRewardsAmount: bn.BigNumber,
  a = 0.8, // TRADER_SCORE_A=800000000000000000
  b = 0.15, // TRADER_SCORE_B=150000000000000000
  c = 0.05, // TRADER_SCORE_C=050000000000000000
): void => {
  const traderScore: { [address: string]: bn.BigNumber } = {}
  let traderScoreSum = new bn.BigNumber(0)

  Object.keys(epochData.tradeFeesPaid).forEach((addr) => {
    const linkedAddress = epochData.linkedPrimaryAddresses[addr]
    const f = epochData.tradeFeesPaid[addr]
    const d = epochData.averageOpenInterest[addr] || 0
    const g =
      epochData.averageActiveStakedDYDX[linkedAddress] ||
      epochData.averageActiveStakedDYDX[addr] ||
      0
    const score = new bn.BigNumber(f ** a)
      .times(d ** b)
      .times(bn.BigNumber.max(new bn.BigNumber(10), g).toNumber() ** c)

    traderScore[addr] = score
    traderScoreSum = traderScoreSum.plus(score)
  })

  Object.keys(traderScore).forEach((addr) => {
    const addressToGiveRewardsTo = epochData.linkedPrimaryAddresses[addr] || addr
    const reward = traderRewardsAmount
      .times(traderScore[addr])
      .div(traderScoreSum)
      .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
      .toFixed()
    if (reward !== '0') {
      addReward(addressRewards, addressToGiveRewardsTo, reward)
    }
  })
}
