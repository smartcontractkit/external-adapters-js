import { getTokenAllocations } from '../src/tvl'
import { ethers } from 'ethers'

describe('getTokenAllocations', () => {
  describe('successful calls @integration', () => {
    it(`gets the allocations`, async () => {
      const controller = '0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217'
      const provider = new ethers.providers.InfuraProvider()
      await getTokenAllocations(controller, provider)
    })
  })
})
