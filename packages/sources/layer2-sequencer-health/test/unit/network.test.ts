import { ExtendedConfig, makeConfig, Networks } from '../../src/config'
import * as network from '../../src/network'
import * as evm from '../../src/evm'
import * as starkware from '../../src/starkware'
import { useFakeTimers } from 'sinon'

jest.mock('../../src/evm', () => {
  const mockNetworkHandler = jest.fn().mockReturnValue(1)
  return {
    ...jest.requireActual('../../src/evm'),
    requestBlockHeight: mockNetworkHandler,
    checkOptimisticRollupBlockHeight: jest.fn().mockImplementation((network) => () => {
      mockNetworkHandler(network)
      return true
    }),
  }
})

jest.mock('../../src/starkware', () => {
  return {
    ...jest.requireActual('../../src/starkware'),
    checkStarkwareSequencerPendingTransactions: jest
      .fn()
      .mockReturnValue(jest.fn().mockReturnValue(true)),
  }
})

describe('network', () => {
  let config: ExtendedConfig
  let clock: any

  beforeEach(async () => {
    config = makeConfig()
    clock = useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  describe('#getStatusByTransaction', () => {
    describe('when fetching Starkware Sequencer status', () => {
      describe('when dummy contract initialized', () => {
        it('returns true', async () => {
          jest.spyOn(starkware, 'sendDummyStarkwareTransaction').mockRejectedValue({
            errorCode: 'StarknetErrorCode.OUT_OF_RANGE_FEE',
          })
          expect(await network.getStatusByTransaction(Networks.Starkware, config)).toBe(true)
        })
      })

      describe('when dummy contract not initialized', () => {
        it('returns true', async () => {
          jest.spyOn(starkware, 'sendDummyStarkwareTransaction').mockRejectedValue({
            errorCode: 'StarknetErrorCode.UNINITIALIZED_CONTRACT',
          })
          expect(await network.getStatusByTransaction(Networks.Starkware, config)).toBe(true)
        })
      })

      describe('when transaction fails with unexpected error', () => {
        it('returns false', async () => {
          jest.spyOn(starkware, 'sendDummyStarkwareTransaction').mockRejectedValue({
            errorCode: 'Unexpected error',
          })
          expect(await network.getStatusByTransaction(Networks.Starkware, config)).toBe(false)
        })
      })
    })

    /**
     * TO_BE_IMPLEMENTED
     *  describe('when fetching EVM Sequencer status', () => {})
     *  */
  })

  describe('#checkNetworkProgressFn', () => {
    it('checks for the Arbitrum block height correctly', async () => {
      await network.checkNetworkProgress(Networks.Arbitrum, config)
      expect(evm.requestBlockHeight).toHaveBeenCalledWith(Networks.Arbitrum)
    })

    it('checks for the Starkware block height correctly', async () => {
      await network.checkNetworkProgress(Networks.Starkware, config)
      expect(starkware.checkStarkwareSequencerPendingTransactions).toHaveBeenCalled()
    })

    it('checks for the Optimism block height correctly', async () => {
      await network.checkNetworkProgress(Networks.Optimism, config)
      expect(evm.requestBlockHeight).toHaveBeenCalledWith(Networks.Optimism)
    })

    it('checks for the Metis block height correctly', async () => {
      await network.checkNetworkProgress(Networks.Metis, config)
      expect(evm.requestBlockHeight).toHaveBeenCalledWith(Networks.Metis)
    })
  })
})
