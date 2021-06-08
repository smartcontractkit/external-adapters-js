import { AddressRewards, MerkleTreeData } from '../../src/ipfs-data'
import { ethers } from 'ethers'
import mockRewards from '../mock-data/rewards.json'
import { constructMerkleTree } from '../../src/method/poke'

export const EXPECTED_MOCK_ROOT = 'f9096745e9a694fbc45fec9c97663ccdb8d98286196a2e19369076dfc7baaf70'

export const deconstructJsonTree = (data: MerkleTreeData): AddressRewards => {
  const res: AddressRewards = {}
  for (const datum of data) {
    res[datum[0]] = ethers.BigNumber.from(datum[1])
  }
  return res
}

describe('merkle tree', () => {
  const rewards = deconstructJsonTree(mockRewards)

  it('should construct a merkle tree with matching root', () => {
    const tree = constructMerkleTree(rewards)
    expect(tree.getRoot().toString('hex')).toEqual(EXPECTED_MOCK_ROOT)
  })
})
