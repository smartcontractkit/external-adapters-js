import { ExtendedConfig, makeConfig, Networks } from '../../src/config'
import * as network from '../../src/network'
import * as starkware from '../../src/starkware'

describe('network', () => {
  let config: ExtendedConfig

  beforeEach(async () => {
    config = makeConfig()
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
})
