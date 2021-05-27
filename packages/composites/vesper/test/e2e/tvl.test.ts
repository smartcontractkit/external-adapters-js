import { getTokenAllocations } from '../../src/tvl'
import { ethers } from 'ethers'
import { DEFAULT_CONTROLLER_ADDRESS } from '../../src/config'

describe('getTokenAllocations', () => {
  describe('successful calls @integration', () => {
    it(`gets the allocations`, async () => {
      const provider = new ethers.providers.InfuraProvider()
      await getTokenAllocations(DEFAULT_CONTROLLER_ADDRESS, provider)
    })
  })
})
