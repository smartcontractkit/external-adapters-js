import BigNumber from 'bignumber.js'
import { calcMarketMakerRewards } from '../../src/method/formulas/initial'
import { calcTraderRewards } from '../../src/method/formulas/dip-7'
import { MerkleTreeData, OracleRewardsData } from '../../src/ipfs-data'
import {
  calcCumulativeRewards,
  constructJsonTree,
  deconstructJsonTree,
} from '../../src/method/poke'

const sampleOracleData: OracleRewardsData = {
  epoch: 10,
  tradeFeesPaid: {
    '0x91a1725a6430b2286833c6da3628291e61f94a2d': 857414.016326,
    '0xe209b1e7e1f655efa2d95c4ec5c50ecd6198a3cd': 4279326.854341,
    '0x59b2cd4b349decfcd86ab4c66302498ce28ae968': 16.572241,
    '0x6717acfa83bfc9855e3f68208f82e16ad5948816': 1442.575974,
    '0xa23842c61ca1e15bb148ab13840768b87f04e642': 84.150952,
    '0xaf6206e4703afe80d070968c0be8eeeb0467647e': 1.482202,
    '0x3026f93d804f01fa212669fe8263bf9a00b664ec': 1.51602,
  },
  averageOpenInterest: {
    '0x91a1725a6430b2286833c6da3628291e61f94a2d': 33794659.77482,
    '0xe209b1e7e1f655efa2d95c4ec5c50ecd6198a3cd': 31775225.43164,
    '0x59b2cd4b349decfcd86ab4c66302498ce28ae968': 235663597.941858,
    '0x6717acfa83bfc9855e3f68208f82e16ad5948816': 998426732.842627,
    '0xa23842c61ca1e15bb148ab13840768b87f04e642': 1629757.506005,
    '0xc9bca1ae62faeeebc241b716170b886eccfd2da2': 10259496994.89614,
  },
  averageActiveStakedDYDX: {
    '0x59b2cd4b349decfcd86ab4c66302498ce28ae968': 20.111111,
    '0x6717acfa83bfc9855e3f68208f82e16ad5948816': 1000.222222,
    '0xa23842c61ca1e15bb148ab13840768b87f04e642': 34432.518184,
    '0xaf6206e4703afe80d070968c0be8eeeb0467647e': 167.078178,
    '0x3026f93d804f01fa212669fe8263bf9a00b664ec': 8.102903,
    '0xb506037e49ec39b02c9578801213cb4bfdc5b9dd': 10000.0,
  },
  quoteScore: {
    '0x59b2cd4b349decfcd86ab4c66302498ce28ae968': 0.011528314450261408,
    '0xa23842c61ca1e15bb148ab13840768b87f04e642': 0.03509865199614617,
    '0xb506037e49ec39b02c9578801213cb4bfdc5b9dd': 0.56701282657183,
    '0x6717acfa83bfc9855e3f68208f82e16ad5948816': 0.06701282657183,
  },
  linkedPrimaryAddresses: {
    '0x6717acfa83bfc9855e3f68208f82e16ad5948816': '0xa23842c61ca1e15bb148ab13840768b87f04e642',
    '0xe209b1e7e1f655efa2d95c4ec5c50ecd6198a3cd': '0xa23842c61ca1e15bb148ab13840768b87f04e642',
  },
}

const previousMerkleTreeRewardsData: MerkleTreeData = [
  ['0x91a1725a6430b2286833c6da3628291e61f94a2d', '100'],
  ['0xe209b1e7e1f655efa2d95c4ec5c50ecd6198a3cd', '100'],
  ['0x59b2cd4b349decfcd86ab4c66302498ce28ae968', '100'],
  ['0x6717acfa83bfc9855e3f68208f82e16ad5948816', '100'],
  ['0xa23842c61ca1e15bb148ab13840768b87f04e642', '100'],
  ['0xaf6206e4703afe80d070968c0be8eeeb0467647e', '100'],
  ['0x3026f93d804f01fa212669fe8263bf9a00b664ec', '100'],
  ['0xc9bca1ae62faeeebc241b716170b886eccfd2da2', '100'],
  ['0xb506037e49ec39b02c9578801213cb4bfdc5b9dd', '100'],
]

describe('rewards-verifier', () => {
  describe('rewards calculations', () => {
    it('getTraderRewards', () => {
      const TRADER_REWARDS = {}
      calcTraderRewards(sampleOracleData, TRADER_REWARDS, new BigNumber(1))
      console.log('//dfsdf', TRADER_REWARDS)
      expect(TRADER_REWARDS).toEqual({
        '0x91a1725a6430b2286833c6da3628291e61f94a2d': new BigNumber('599002446611192601512849'),
        '0xa23842c61ca1e15bb148ab13840768b87f04e642': new BigNumber('3236472926103710276116359'),
        '0x59b2cd4b349decfcd86ab4c66302498ce28ae968': new BigNumber('140627285097122370790'),
      })
    })

    it('getLiquidityProviderRewards', () => {
      const LIQUIDITY_PROVIDER_REWARDS = {}
      calcMarketMakerRewards(sampleOracleData, LIQUIDITY_PROVIDER_REWARDS, new BigNumber(1))

      expect(LIQUIDITY_PROVIDER_REWARDS).toEqual({
        '0x59b2cd4b349decfcd86ab4c66302498ce28ae968': new BigNumber('19489322646239653789906'),
        '0xa23842c61ca1e15bb148ab13840768b87f04e642': new BigNumber('172625717339862054134261'),
        '0xb506037e49ec39b02c9578801213cb4bfdc5b9dd': new BigNumber('958569960013898292075832'),
      })
    })

    it('calculateExpectedOracleResult', () => {
      const rewards = {}

      calcTraderRewards(sampleOracleData, rewards, new BigNumber(1))
      calcMarketMakerRewards(sampleOracleData, rewards, new BigNumber(1))

      const previousAddressRewards = deconstructJsonTree(previousMerkleTreeRewardsData)

      calcCumulativeRewards(rewards, previousAddressRewards)

      const result = constructJsonTree(rewards)

      expect(result.length).toEqual(previousMerkleTreeRewardsData.length)
      expect(result).toEqual(
        expect.arrayContaining([
          ['0x59B2cd4B349DECfcD86Ab4C66302498ce28aE968', '19629949931336776160796'],
          ['0xa23842C61ca1e15bB148Ab13840768b87f04E642', '3409098643443572330250720'],
          ['0xAf6206e4703aFE80d070968C0Be8EEeb0467647e', '100'],
          ['0xc9bcA1AE62FaEeEBc241b716170B886eCcfD2Da2', '100'],
          ['0xE209B1E7e1f655efa2D95C4eC5c50ECD6198a3Cd', '100'],
          ['0x91A1725A6430B2286833C6Da3628291E61f94a2D', '599002446611192601512949'],
          ['0xB506037e49ec39B02C9578801213cb4BfDc5B9dD', '958569960013898292075932'],
          ['0x3026F93D804f01Fa212669FE8263Bf9a00B664ec', '100'],
          ['0x6717AcFA83BFc9855e3F68208f82E16Ad5948816', '100'],
        ]),
      )
    })
  })
})
