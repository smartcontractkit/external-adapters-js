import { CHAIN_DELTA, ExtendedConfig, Networks, makeConfig } from '../../src/config'
import * as starkware from '../../src/starkware'
import * as network from '../../src/network'
import { useFakeTimers } from 'sinon'

describe('starkware', () => {
  let config: ExtendedConfig
  let clock: any

  beforeEach(async () => {
    config = makeConfig()
    clock = useFakeTimers()
  })

  afterEach(() => {
    clock.restore()
  })

  describe('#checkStarkwareSequencerPendingTransactions', () => {
    describe('when request to fetch pending block from gateway fails', () => {
      it('returns false', async () => {
        jest.spyOn(network, 'retry').mockRejectedValue({
          providerStatusCode: 504,
        })
        const fn = starkware.checkStarkwareSequencerPendingTransactions()
        expect(await fn(config)).toBe(false)
      })
    })

    describe('when request to fetch pending block from gateway succeeds', () => {
      describe('when there is a new pending block within the max interval', () => {
        it('returns true', async () => {
          const fn = starkware.checkStarkwareSequencerPendingTransactions()
          jest.spyOn(network, 'retry').mockReturnValueOnce(
            Promise.resolve({
              parent_hash: 'hash-one',
              transactions: ['tx1', 'tx2'],
            }),
          )

          expect(await fn(config)).toBe(true)
          const timeToNextCall = CHAIN_DELTA[Networks.Starkware] - 10 * 1000
          clock.tick(timeToNextCall)
          jest.spyOn(network, 'retry').mockReturnValueOnce(
            Promise.resolve({
              parent_hash: 'hash-two',
              transactions: ['tx1', 'tx2'],
            }),
          )
          expect(await fn(config)).toBe(true)
        })
      })

      describe('when there is no new pending block within the max interval', () => {
        let fn: (config: ExtendedConfig) => Promise<boolean>

        beforeEach(async () => {
          fn = starkware.checkStarkwareSequencerPendingTransactions()
          jest.spyOn(network, 'retry').mockReturnValueOnce(
            Promise.resolve({
              parent_hash: 'hash-one',
              transactions: ['tx1', 'tx2'],
            }),
          )
          await fn(config)
        })

        describe('when there are new transactions', () => {
          it('returns true', async () => {
            const timeToNextCall = CHAIN_DELTA[Networks.Starkware] - 10 * 1000
            clock.tick(timeToNextCall)
            jest.spyOn(network, 'retry').mockReturnValueOnce(
              Promise.resolve({
                parent_hash: 'hash-one',
                transactions: ['tx1', 'tx2', 'tx3'],
              }),
            )
            expect(await fn(config)).toBe(true)
          })
        })

        describe('when there are no new transactons', () => {
          it('returns false', async () => {
            const timeToNextCall = CHAIN_DELTA[Networks.Starkware] - 10 * 1000
            clock.tick(timeToNextCall)
            jest.spyOn(network, 'retry').mockReturnValueOnce(
              Promise.resolve({
                parent_hash: 'hash-one',
                transactions: ['tx1', 'tx2'],
              }),
            )
            expect(await fn(config)).toBe(false)
          })
        })
      })
    })
  })
})
