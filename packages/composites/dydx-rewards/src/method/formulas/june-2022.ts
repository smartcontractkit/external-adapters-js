import { Logger } from '@chainlink/ea-bootstrap'
import * as bn from 'bignumber.js'
import { AddressRewards, OracleRewardsData } from '../../ipfs-data'
import { addReward } from '../poke'
/**
 * Calculate trader rewards using the forumula voted in here:
 * https://forums.dydx.community/snapshot/dydxgov.eth/0xce4b1334f337975a42c3f78dd16fb25e0b60e816a2d9382e402b5384bea37475
 *
 * @param epochData
 * @param addressRewards
 * @param traderRewardsAmount
 * @param a
 * @param b
 * @param c
 * @returns void
 */
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

  if (!epochData.linkedPrimaryAddresses)
    Logger.warn('Oracle Rewards Data must does not contain any linked primary addresses')

  Object.keys(epochData.linkedPrimaryAddresses ?? {}).forEach((addr) => {
    const f = epochData?.tradeFeesPaid?.[addr] || 0
    const d = epochData?.openInterest?.[addr] || 0
    const g = epochData?.averageActiveStakedDYDX?.[addr] || 0

    const primaryAddress = epochData?.linkedPrimaryAddresses?.[addr]
    if (!primaryAddress) {
      Logger.warn(`No primary address found for ${addr}`)
      return
    }

    epochData.tradeFeesPaid[primaryAddress] = (epochData.tradeFeesPaid[primaryAddress] || 0) + f
    epochData.openInterest[primaryAddress] = (epochData.openInterest[primaryAddress] || 0) + d
    if (epochData.averageActiveStakedDYDX)
      epochData.averageActiveStakedDYDX[primaryAddress] =
        (epochData.averageActiveStakedDYDX[primaryAddress] || 0) + g
  })

  let i = 0
  let j = 1
  const output = ['']
  const output2 = ['']
  Object.keys(epochData.tradeFeesPaid).forEach((addr) => {
    const linkedAddress = epochData?.linkedPrimaryAddresses?.[addr]
    if (linkedAddress) return

    const f = epochData?.tradeFeesPaid?.[addr]
    const d = epochData?.openInterest?.[addr] || 0
    const g = epochData?.averageActiveStakedDYDX?.[addr] || 0

    const score = new bn.BigNumber(f ** a)
      .times(d ** b)
      .times(bn.BigNumber.max(new bn.BigNumber(10), g).toNumber() ** c)
    traderScore[addr] = score
    traderScoreSum = traderScoreSum.plus(score)
    i += 1
    output.push(`${i} ${score.toString()} ${traderScoreSum.toString()}`)
    if (i === j) {
      output2.push(`${i} ${score.toString()} ${traderScoreSum.toString()}`)
      j *= 2
    }
    if (i === 1402) {
      console.log('dskloetx calcTraderRewards', i, score.toString(), traderScoreSum.toString(), {
        a,
        b,
        c,
        d,
        f,
        g,
        dd: d === 1773340334.110449,
        ff: f === 18.567997,
        fa: f ** a === 10.351708783335381,
        db: d ** b === 24.39601062398205,
        gc: 10 ** c === 1.1220184543019633,
        FA: new bn.BigNumber(f ** a).toString(),
        FADB: new bn.BigNumber(10.351708783335381).times(24.39601062398205).toString(),
        FADBGC: new bn.BigNumber(10.351708783335381)
          .times(24.39601062398205)
          .times(1.1220184543019633)
          .toString(),
      })
    }
  })

  //console.log('dskloetx calcTraderRewards traderScoreSum:', output.join('\n'), output2.join('\n'))

  if (traderScoreSum.isZero()) return

  Object.keys(traderScore).forEach((addr) => {
    if (addr === '0x00000000002763419d1c9adda5df54f13d63e29b') {
      console.log('dskloetx calcTraderRewards 1', {
        traderRewardsAmount: traderRewardsAmount,
        'traderRewardsAmount.toString()': traderRewardsAmount.toString(),
        'traderScore[addr]': traderScore[addr],
        'traderScore[addr].toString()': traderScore[addr].toString(),
        traderScoreSum: traderScoreSum,
        'traderScoreSum.toString()': traderScoreSum.toString(),
      })
    }
    const reward = traderRewardsAmount
      .times(traderScore[addr])
      .div(traderScoreSum)
      .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
      .toFixed()
    if (reward !== '0') {
      if (addr === '0x00000000002763419d1c9adda5df54f13d63e29b') {
        console.log('dskloetx calcTraderRewards 2', reward)
      }
      addReward(addressRewards, addr, reward)
      if (addr === '0x00000000002763419d1c9adda5df54f13d63e29b') {
        console.log('dskloetx calcTraderRewards 3', reward)
      }
    }
  })
}
