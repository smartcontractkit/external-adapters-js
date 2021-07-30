import * as IPFS_Adapter from '@chainlink/ipfs-adapter'
import { calculateRewards, deconstructJsonTree, Input } from '../../src/method/poke'
import { BigNumber } from 'ethers'
import * as bn from 'bignumber.js'
import mockRewards from '../mock-data/rewards.json'

describe('rewards', () => {
  const jobRunID = '1'
  const ipfs = IPFS_Adapter.makeExecute()
  const defaultInput: Input = {
    traderRewardsAmount: new bn.BigNumber('5e23'),
    marketMakerRewardsAmount: new bn.BigNumber('2e23'),
    ipnsName: 'k51qzi5uqu5dlkb9yviadsfl3uxndbkyhf4n97u1t1np5e9f67zwmjz6yk9m9k',
    traderScoreAlpha: 0.7,
    newEpoch: BigNumber.from(0),
    activeRootIpfsCid: 'bafkreigx6x553cdksm5gj2hh2fkhs2csjnmnny3zxp3tcyzevfj3f3ekli',
  }
  const rewards = deconstructJsonTree(mockRewards)

  it('should calculate the correct rewards for epoch 0', async () => {
    const addressRewards = await calculateRewards(jobRunID, defaultInput, ipfs)
    expect(addressRewards).toEqual(rewards)
  })

  it('should add cumulative rewards after epoch 0', async () => {
    const input = {
      ...defaultInput,
      newEpoch: BigNumber.from(1),
    }

    // We expect the cumulative rewards for epoch 1 to be twice as much as epoch 0
    const expectedRewards = Object.keys(rewards).reduce(
      (obj, addr) => ({
        ...obj,
        [addr]: rewards[addr].mul(2),
      }),
      {},
    )

    const addressRewards = await calculateRewards(jobRunID, input, ipfs)
    expect(addressRewards).toEqual(expectedRewards)
  })
})
