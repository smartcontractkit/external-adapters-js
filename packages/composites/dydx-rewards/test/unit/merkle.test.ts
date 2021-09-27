import { ethers } from 'ethers'
import { constructJsonTree, deconstructJsonTree, hashFn, keccakReward } from '../../src/method/poke'
import mockRewards from '../mock-data/rewards.json'

describe('keccakReward', () => {
  const tests = [
    {
      name: 'should create correct hash',
      data: {
        address: '0xE4dDb4233513498b5aa79B98bEA473b01b101a67',
        rewards: ethers.BigNumber.from(123),
      },
      expect: 'f653091b92ed0c143acbb679e6a1194b2ae6666249387dfff4ae61985eb02287',
    },
    {
      name: 'should make address checksummed before hashing',
      data: {
        address: '0xe4ddb4233513498b5aa79b98bea473b01b101a67',
        rewards: ethers.BigNumber.from(123),
      },
      expect: 'f653091b92ed0c143acbb679e6a1194b2ae6666249387dfff4ae61985eb02287',
    },
  ]

  for (const test of tests) {
    it(test.name, () => {
      const result = keccakReward(test.data.address, test.data.rewards)
      expect(result.toString('hex')).toEqual(test.expect)
    })
  }
})

describe('hashFn', () => {
  const tests = [
    {
      name: 'should create correct hash',
      data: '01c31066bdf5ea47fa5342838112beb10253797d89ed958b8e6286f8988bdea202eb296addb5358cc7bf3efaa8c4fc1555874e6a308d8a4436ba7b581b9176de',
      expect: 'bfc8e17f15a44038fa611ae5e0f842f46bcfdf43e1f7330c4ee5684abc35eeda',
    },
  ]

  for (const test of tests) {
    it(test.name, () => {
      const result = hashFn(Buffer.from(test.data, 'hex'))
      expect(result.toString('hex')).toEqual(test.expect)
    })
  }
})

describe('constructJsonTree', () => {
  // In order to deterministically get a different array from the original
  // one (besides when n=1), simply reverse the array. The function is
  // supposed to sort it to the correct order.
  const rewards = deconstructJsonTree(mockRewards)
  const shuffledRewards = deconstructJsonTree([...mockRewards].reverse())

  it('should generate the same JSON tree no matter the order', () => {
    const regularJsonTree = constructJsonTree(rewards)
    const shuffledJsonTree = constructJsonTree(shuffledRewards)
    expect(shuffledJsonTree).toStrictEqual(regularJsonTree)
  })

  it('should generate the same JSON tree', () => {
    const jsonTree = constructJsonTree(shuffledRewards)
    expect(jsonTree).toStrictEqual(mockRewards)
  })
})
