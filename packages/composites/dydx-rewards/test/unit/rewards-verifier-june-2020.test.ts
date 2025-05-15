import * as bn from 'bignumber.js'
import { calcMarketMakerRewards } from '../../src/method/formulas/initial'
import { calcTraderRewards } from '../../src/method/formulas/june-2022'
import expectedRewards from '../mock-data/expected-result-2.json'
import previousMerkleTreeRewardsData from '../mock-data/previous-test-data-2.json'
import sampleOracleData from '../mock-data/rewards-test-data-4.json'

import {
  calcCumulativeRewards,
  constructJsonTree,
  deconstructJsonTree,
} from '../../src/method/poke'

const sortArray = (arr: string[][]) => {
  arr.sort((a, b) => {
    const sa = JSON.stringify(a)
    const sb = JSON.stringify(b)
    if (sa < sb) return -1
    if (sa > sb) return 1
    return 0
  })
}

describe('rewards-verifier', () => {
  describe('rewards calculations', () => {
    it('calculateExpectedOracleResult', () => {
      console.log('dskloetx test 1')
      const rewards = {}

      console.log(
        'dskloetx 1 rewards[0x00000000002763419d1c9adDA5df54f13D63e29B] =',
        rewards['0x00000000002763419d1c9adDA5df54f13D63e29B'],
      )
      calcTraderRewards(sampleOracleData, rewards, new bn.BigNumber(3_835_616).shiftedBy(18))
      console.log(
        'dskloetx 2 rewards[0x00000000002763419d1c9adDA5df54f13D63e29B] =',
        rewards['0x00000000002763419d1c9adDA5df54f13D63e29B'],
      )
      calcMarketMakerRewards(sampleOracleData, rewards, new bn.BigNumber(1_150_685).shiftedBy(18))

      console.log(
        'dskloetx 3 rewards[0x00000000002763419d1c9adDA5df54f13D63e29B] =',
        rewards['0x00000000002763419d1c9adDA5df54f13D63e29B'],
      )
      const previousAddressRewards = deconstructJsonTree(
        previousMerkleTreeRewardsData as [string, string][],
      )

      console.log(
        'dskloetx 4 rewards[0x00000000002763419d1c9adDA5df54f13D63e29B] =',
        rewards['0x00000000002763419d1c9adDA5df54f13D63e29B'],
      )
      console.log(
        'dskloetx previousAddressRewards[0x00000000002763419d1c9adDA5df54f13D63e29B] =',
        previousAddressRewards['0x00000000002763419d1c9adda5df54f13d63e29b'],
      )
      calcCumulativeRewards(rewards, previousAddressRewards)

      const result = constructJsonTree(rewards)

      sortArray(result)
      sortArray(expectedRewards)

      expect(result.slice(0, 30)).toEqual(expectedRewards.slice(0, 30))
      console.log('dskloetx test 2')
    })

    it('bla', () => {
      const traderRewardsAmount = new bn.BigNumber('3.835616e+24')
      const traderScoreAddr = new bn.BigNumber('136.2080366087203706546465621375922553920933956156')
      const traderScoreSum = new bn.BigNumber(
        '27180191.497704501803055711578679243004027107008846592684248',
      )

      const reward = traderRewardsAmount
        .times(traderScoreAddr)
        .div(traderScoreSum)
        .decimalPlaces(0, bn.BigNumber.ROUND_FLOOR)
        .toFixed()

      expect(reward).toEqual('0')
    })
  })
})
