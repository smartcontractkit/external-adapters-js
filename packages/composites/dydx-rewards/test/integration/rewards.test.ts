import * as IPFS_Adapter from '@chainlink/ipfs-adapter'
import { calculateRewards, Input } from '../../src/method/poke'
import { BigNumber, ethers } from 'ethers'
import mockRewards from '../mock-data/rewards.json'
import { deconstructJsonTree } from '../e2e/merkle.test'

describe('rewards', () => {
  const jobRunID = '1'
  const ipfs = IPFS_Adapter.makeExecute()
  const defaultInput: Input = {
    traderRewardsAmount: 5e23,
    marketMakerRewardsAmount: 2e23,
    ipnsName: 'k51qzi5uqu5dlkb9yviadsfl3uxndbkyhf4n97u1t1np5e9f67zwmjz6yk9m9k',
    traderScoreAlpha: 0.7,
  }
  const rewards = deconstructJsonTree(mockRewards)

  it('should calculate the correct rewards for epoch 0', async () => {
    const { addressRewards, newEpoch } = await calculateRewards(
      jobRunID,
      defaultInput,
      ethers.constants.HashZero,
      '',
      BigNumber.from(0),
      ipfs,
    )
    expect(addressRewards).toEqual(rewards)
    expect(newEpoch.toNumber()).toEqual(0)
  })
})
