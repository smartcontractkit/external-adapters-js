import mockRewards from '../mock-data/rewards.json'
import { constructMerkleTree, deconstructJsonTree } from '../../src/method/poke'

describe('merkle tree', () => {
  const rewards = deconstructJsonTree(mockRewards)

  it('should construct a merkle tree with matching root', () => {
    const tree = constructMerkleTree(rewards)
    expect(tree.getRoot().toString('hex')).toMatchSnapshot()
  })
})
