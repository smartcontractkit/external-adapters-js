import { Networks } from '../../src/config'
import { useFakeTimers } from 'sinon'
import * as adapter from '../../src/adapter'
import * as network from '../../src/network'

describe('adapter', () => {
  describe('Network health check', () => {
    let clock
    beforeEach(() => {
      clock = useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it('Stale blocks are unhealthy after Delta seconds', async () => {
      jest.spyOn(network, 'requestBlockHeight').mockReturnValue(Promise.resolve('0x1'))
      const getNetworkStatus = adapter.makeNetworkStatusCheck(Networks.Arbitrum)
      // 2 minutes delta
      const delta = 120 * 1000
      const timeBetweenCalls = 10 * 1000
      // During first two minutes of the block is not considered stale
      for (let i = 0; i < delta / timeBetweenCalls; i++) {
        expect(await getNetworkStatus(delta)).toBe(true)
        clock.tick(timeBetweenCalls)
      }
      // After delta time passed, is considered stale
      expect(await getNetworkStatus(delta)).toBe(false)
    })

    it('Blocks are healthy after Delta seconds if blocks change', async () => {
      const getNetworkStatus = adapter.makeNetworkStatusCheck(Networks.Arbitrum)
      // 2 minutes delta
      const delta = 120 * 1000
      const timeBetweenCalls = 10 * 1000
      // If blocks change, is not considered stale
      for (let i = 0; i < delta / timeBetweenCalls; i++) {
        jest.spyOn(network, 'requestBlockHeight').mockReturnValue(Promise.resolve(`0x${i}`))
        expect(await getNetworkStatus(delta)).toBe(true)
        clock.tick(timeBetweenCalls)
      }
      // After delta time passed the current block should be considered healthy
      expect(await getNetworkStatus(delta)).toBe(true)
      clock.tick(timeBetweenCalls)
      expect(await getNetworkStatus(delta)).toBe(true)
    })
  })
})
