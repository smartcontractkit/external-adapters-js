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

describe('rewards-verifier', () => {
  describe('rewards calculations', () => {
    it('calculateExpectedOracleResult', () => {
      console.log('dskloetx test 1')
      const rewards = {}

      calcTraderRewards(sampleOracleData, rewards, new bn.BigNumber(3_835_616).shiftedBy(18))
      calcMarketMakerRewards(sampleOracleData, rewards, new bn.BigNumber(1_150_685).shiftedBy(18))

      const previousAddressRewards = deconstructJsonTree(
        previousMerkleTreeRewardsData as [string, string][],
      )

      calcCumulativeRewards(rewards, previousAddressRewards)

      const result = constructJsonTree(rewards)

      expect(result).toEqual(expectedRewards)
      console.log('dskloetx test 2')
    })
  })
})
