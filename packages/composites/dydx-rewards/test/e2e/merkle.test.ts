import mockRewards from '../mock-data/rewards.json'
import { constructMerkleTree, deconstructJsonTree } from '../../src/method/poke'

export const EXPECTED_MOCK_ROOT = 'f9096745e9a694fbc45fec9c97663ccdb8d98286196a2e19369076dfc7baaf70'

describe('merkle tree', () => {
  const rewards = deconstructJsonTree(mockRewards)

  it('should construct a merkle tree with matching root', () => {
    const tree = constructMerkleTree(rewards)
    expect(tree.getRoot().toString('hex')).toEqual(EXPECTED_MOCK_ROOT)
  })
})
