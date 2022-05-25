import BigNumber from 'bignumber.js'
import { calcMarketMakerRewards } from '../../src/method/formulas/initial'
import { calcTraderRewards } from '../../src/method/formulas/dip-7'
import previousMerkleTreeRewardsData from '../mock-data/previous-test-data-1.json'
import sampleOracleData from '../mock-data/rewards-test-data-3.json'
import expectedRewards from '../mock-data/expected-test-data-3.json'
import * as bn from 'bignumber.js'

import {
  calcCumulativeRewards,
  constructJsonTree,
  deconstructJsonTree,
} from '../../src/method/poke'

describe('rewards-verifier', () => {
  describe('rewards calculations', () => {
    it('getTraderRewards', () => {
      const TRADER_REWARDS = {}
      calcTraderRewards(sampleOracleData, TRADER_REWARDS, new bn.BigNumber(3_835_616).shiftedBy(18))
      console.log('//dfsdf', TRADER_REWARDS)
      expect(TRADER_REWARDS).toEqual({
        '0x91a1725a6430b2286833c6da3628291e61f94a2d': new BigNumber('599002446611192601512849'),
        '0xa23842c61ca1e15bb148ab13840768b87f04e642': new BigNumber('3236472926103710276116359'),
        '0x59b2cd4b349decfcd86ab4c66302498ce28ae968': new BigNumber('140627285097122370790'),
      })
    })

    it('getLiquidityProviderRewards', () => {
      const LIQUIDITY_PROVIDER_REWARDS = {}
      calcMarketMakerRewards(
        sampleOracleData,
        LIQUIDITY_PROVIDER_REWARDS,
        new bn.BigNumber(1_150_685).shiftedBy(18),
      )

      expect(LIQUIDITY_PROVIDER_REWARDS).toEqual({
        '0x59b2cd4b349decfcd86ab4c66302498ce28ae968': new BigNumber('19489322646239653789906'),
        '0xa23842c61ca1e15bb148ab13840768b87f04e642': new BigNumber('172625717339862054134261'),
        '0xb506037e49ec39b02c9578801213cb4bfdc5b9dd': new BigNumber('958569960013898292075832'),
      })
    })

    it('calculateExpectedOracleResult', () => {
      const rewards = {}

      calcTraderRewards(sampleOracleData, rewards, new bn.BigNumber(3_835_616).shiftedBy(18))
      calcMarketMakerRewards(sampleOracleData, rewards, new bn.BigNumber(1_150_685).shiftedBy(18))

      const previousAddressRewards = deconstructJsonTree(
        previousMerkleTreeRewardsData as [string, string][],
      )

      calcCumulativeRewards(rewards, previousAddressRewards)

      const result = constructJsonTree(rewards)

      expect(result.length).toEqual(previousMerkleTreeRewardsData.length)
      expect(result).toEqual(expect.arrayContaining(expectedRewards))
    })
  })
})
