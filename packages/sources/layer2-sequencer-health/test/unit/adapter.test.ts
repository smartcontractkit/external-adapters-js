import { DEFAULT_DELTA_TIME, makeConfig, Networks, RPC_ENDPOINTS } from '../../src/config'
import { useFakeTimers } from 'sinon'
import * as network from '../../src/network'
import * as adapter from '../../src/adapter'
import { AdapterRequest } from '@chainlink/types'
import { ethers } from 'ethers'

describe('adapter', () => {
  describe('L2 Network health check', () => {
    let clock
    beforeEach(() => {
      clock = useFakeTimers()
    })

    afterEach(() => {
      clock.restore()
    })

    it('Stale blocks are unhealthy after Delta seconds', async () => {
      jest.spyOn(network, 'requestBlockHeight').mockReturnValue(Promise.resolve(1))
      const getNetworkStatus = adapter.makeNetworkStatusCheck(Networks.Arbitrum)
      const deltaBlocks = 0
      // 2 minutes delta
      const delta = 120 * 1000
      const timeBetweenCalls = 10 * 1000
      // During first two minutes of the block is not considered stale
      for (let i = 0; i < delta / timeBetweenCalls; i++) {
        expect(await getNetworkStatus(delta, deltaBlocks)).toBe(true)
        clock.tick(timeBetweenCalls)
      }
      // After delta time passed, is considered stale
      expect(await getNetworkStatus(delta, deltaBlocks)).toBe(false)
    })

    it('Blocks are healthy after Delta seconds if blocks change', async () => {
      const getNetworkStatus = adapter.makeNetworkStatusCheck(Networks.Arbitrum)
      const deltaBlocks = 0
      // 2 minutes delta
      const delta = 120 * 1000
      const timeBetweenCalls = 10 * 1000
      // If blocks change, is not considered stale
      for (let i = 0; i < delta / timeBetweenCalls; i++) {
        jest.spyOn(network, 'requestBlockHeight').mockReturnValue(Promise.resolve(i))
        expect(await getNetworkStatus(delta, deltaBlocks)).toBe(true)
        clock.tick(timeBetweenCalls)
      }
      // After delta time passed the current block should be considered healthy
      expect(await getNetworkStatus(delta, deltaBlocks)).toBe(true)
      clock.tick(timeBetweenCalls)
      expect(await getNetworkStatus(delta, deltaBlocks)).toBe(true)
    })

    it('Blocks are healthy if current is previous to the last seen within a delta difference', async () => {
      const getNetworkStatus = adapter.makeNetworkStatusCheck(Networks.Arbitrum)

      const deltaBlocks = 5
      jest.spyOn(network, 'requestBlockHeight').mockReturnValue(Promise.resolve(10))
      expect(await getNetworkStatus(30, deltaBlocks)).toBe(true)

      jest.spyOn(network, 'requestBlockHeight').mockReturnValue(Promise.resolve(6))
      expect(await getNetworkStatus(30, deltaBlocks)).toBe(true)

      jest.spyOn(network, 'requestBlockHeight').mockReturnValue(Promise.resolve(5))
      expect(await getNetworkStatus(30, deltaBlocks)).toBe(true)

      jest.spyOn(network, 'requestBlockHeight').mockReturnValue(Promise.resolve(4))
      await expect(getNetworkStatus(30, deltaBlocks)).rejects.toThrow()

      jest.spyOn(network, 'requestBlockHeight').mockReturnValue(Promise.resolve(3))
      await expect(getNetworkStatus(30, deltaBlocks)).rejects.toThrow()
    })
  })

  describe('Adapter health check', () => {
    const execute = adapter.makeExecute()
    let clock
    beforeEach(() => {
      clock = useFakeTimers()
      jest.spyOn(network, 'getStatusByTransaction').mockReturnValue(Promise.resolve(false))
    })

    afterEach(() => {
      clock.restore()
    })

    it('If direct sequencer check fails, the network is unhealthy', async () => {
      jest.spyOn(network, 'getSequencerHealth').mockReturnValue(Promise.resolve(false))

      const response = await execute(
        {
          data: {
            network: 'arbitrum',
          },
        } as AdapterRequest,
        undefined,
      )

      expect(response.data.result).toBe(1)
    })

    it('If direct sequencer check throws, the network is unhealthy', async () => {
      jest
        .spyOn(network, 'getSequencerHealth')
        .mockReturnValue(Promise.reject(new Error('Endpoint is not available')))

      const response = await execute(
        {
          data: {
            network: 'arbitrum',
          },
        } as AdapterRequest,
        undefined,
      )

      expect(response.data.result).toBe(1)
    })

    it('If direct sequencer check succeeds and L2 network check succeeds, the network is healthy', async () => {
      jest.spyOn(network, 'getSequencerHealth').mockReturnValue(Promise.resolve(true))
      jest.spyOn(network, 'requestBlockHeight').mockReturnValue(Promise.resolve(1))

      const response = await execute(
        {
          data: {
            network: 'arbitrum',
          },
        } as AdapterRequest,
        undefined,
      )

      expect(response.data.result).toBe(0)
    })

    it('If direct sequencer check succeeds and L2 network check fails, the network is unhealthy', async () => {
      jest.spyOn(network, 'getSequencerHealth').mockReturnValue(Promise.resolve(true))
      jest.spyOn(network, 'requestBlockHeight').mockReturnValue(Promise.resolve(1))

      await execute(
        {
          data: {
            network: 'arbitrum',
          },
        } as AdapterRequest,
        undefined,
      )

      clock.tick(DEFAULT_DELTA_TIME + 1)

      const response = await execute(
        {
          data: {
            network: 'arbitrum',
          },
        } as AdapterRequest,
        undefined,
      )

      expect(response.data.result).toBe(1)
    })

    it('If direct sequencer check succeeds and L2 network check throws, the network is unhealthy', async () => {
      jest.spyOn(network, 'getSequencerHealth').mockReturnValue(Promise.resolve(true))
      jest
        .spyOn(network, 'requestBlockHeight')
        .mockReturnValue(Promise.reject(new Error('Some RPC call error')))

      const response = await execute(
        {
          data: {
            network: 'arbitrum',
          },
        } as AdapterRequest,
        undefined,
      )

      expect(response.data.result).toBe(1)
    })

    it('Empty transaction check has the final word on unhealthy method responses', async () => {
      jest.spyOn(network, 'getSequencerHealth').mockReturnValue(Promise.resolve(false))
      jest.spyOn(network, 'getStatusByTransaction').mockReturnValue(Promise.resolve(true))
      jest
        .spyOn(network, 'requestBlockHeight')
        .mockReturnValue(Promise.reject(new Error('Some RPC call error')))

      const response = await execute(
        {
          data: {
            network: 'arbitrum',
          },
        } as AdapterRequest,
        undefined,
      )

      expect(response.data.result).toBe(0)
    })

    it('Empty transaction confirms rest of methods', async () => {
      jest.spyOn(network, 'getSequencerHealth').mockReturnValue(Promise.resolve(false))
      jest.spyOn(network, 'getStatusByTransaction').mockReturnValue(Promise.resolve(false))

      const response = await execute(
        {
          data: {
            network: 'arbitrum',
          },
        } as AdapterRequest,
        undefined,
      )

      expect(response.data.result).toBe(1)
    })
  })

  describe('Adapter build', () => {
    it('Cache enabled throws when building the adapter', async () => {
      process.env.CACHE_ENABLED = 'true'
      const execute = adapter.makeExecute()
      await expect(
        execute(
          {
            id: '',
            data: {},
          },
          undefined,
        ),
      ).rejects.toThrow()
    })
  })
})
