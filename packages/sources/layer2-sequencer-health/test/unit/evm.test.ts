import { ExtendedConfig, Networks } from '../../src/config'
import { useFakeTimers } from 'sinon'
import { Requester } from '@chainlink/ea-bootstrap'
import * as evm from '../../src/evm'
import { makeConfig } from '../../src/config'
import { AxiosResponse } from '@chainlink/ea-bootstrap'

const getMockAxiosResponse = (response: unknown): AxiosResponse => ({
  status: 204,
  statusText: 'success',
  headers: {},
  config: {},
  data: response,
})

const deltaChain = {
  [Networks.Arbitrum]: 30000,
  [Networks.Optimism]: 30000,
}

describe('evm', () => {
  describe('L2 Network health check', () => {
    let clock: any
    let config: ExtendedConfig

    beforeEach(() => {
      clock = useFakeTimers()
      config = makeConfig()
    })

    afterEach(() => {
      clock.restore()
    })

    it('Stale blocks are unhealthy after Delta seconds', async () => {
      jest.spyOn(Requester, 'request').mockReturnValue(
        Promise.resolve(
          getMockAxiosResponse({
            result: '0x1',
          }),
        ),
      )
      const checkBlockHeight = evm.checkOptimisticRollupBlockHeight(Networks.Arbitrum)
      config.deltaChain = deltaChain as Record<Networks, number>
      const delta = config.deltaChain[Networks.Arbitrum]
      const timeBetweenCalls = 10 * 1000
      // During first two minutes of the block is not considered stale
      for (let i = 0; i < delta / timeBetweenCalls; i++) {
        expect(await checkBlockHeight(config)).toBe(true)
        clock.tick(timeBetweenCalls)
      }
      // After delta time passed, is considered stale
      expect(await checkBlockHeight(config)).toBe(false)
    })

    it('Blocks are healthy after Delta seconds if blocks change', async () => {
      const checkBlockHeight = evm.checkOptimisticRollupBlockHeight(Networks.Optimism)
      config.deltaBlocks = 0
      config.deltaChain = deltaChain as Record<Networks, number>
      const delta = config.deltaChain[Networks.Optimism]
      const timeBetweenCalls = 10 * 1000
      // If blocks change, is not considered stale
      for (let i = 0; i < delta / timeBetweenCalls; i++) {
        jest.spyOn(Requester, 'request').mockReturnValue(
          Promise.resolve(
            getMockAxiosResponse({
              result: i.toString(16),
            }),
          ),
        )
        expect(await checkBlockHeight(config)).toBe(true)
        clock.tick(timeBetweenCalls)
      }
      // After delta time passed the current block should be considered healthy
      expect(await checkBlockHeight(config)).toBe(true)
      clock.tick(timeBetweenCalls)
      expect(await checkBlockHeight(config)).toBe(true)
    })

    it('Blocks are healthy if current is previous to the last seen within a delta difference', async () => {
      const checkBlockHeight = evm.checkOptimisticRollupBlockHeight(Networks.Arbitrum)
      config.deltaBlocks = 5
      config.deltaChain = deltaChain as Record<Networks, number>
      jest.spyOn(Requester, 'request').mockReturnValue(
        Promise.resolve(
          getMockAxiosResponse({
            result: '0xa',
          }),
        ),
      )

      expect(await checkBlockHeight(config)).toBe(true)

      jest.spyOn(Requester, 'request').mockReturnValue(
        Promise.resolve(
          getMockAxiosResponse({
            result: '0x6',
          }),
        ),
      )
      expect(await checkBlockHeight(config)).toBe(true)

      jest.spyOn(Requester, 'request').mockReturnValue(
        Promise.resolve(
          getMockAxiosResponse({
            result: '0x5',
          }),
        ),
      )
      expect(await checkBlockHeight(config)).toBe(true)

      jest.spyOn(Requester, 'request').mockReturnValue(
        Promise.resolve(
          getMockAxiosResponse({
            result: '0x4',
          }),
        ),
      )
      await expect(checkBlockHeight(config)).rejects.toThrow()

      jest.spyOn(Requester, 'request').mockReturnValue(
        Promise.resolve(
          getMockAxiosResponse({
            result: '0x3',
          }),
        ),
      )
      await expect(checkBlockHeight(config)).rejects.toThrow()
    })
  })
})
