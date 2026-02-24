import { BlockWithTxHashes } from 'starknet'
import { checkBatcherHealthy } from '../../src/starkware'

const createMockBlock = (parentHash: string, transactions: string[]): BlockWithTxHashes =>
  ({
    parent_hash: parentHash,
    transactions,
  } as unknown as BlockWithTxHashes)

describe('starkware utils', () => {
  describe('checkBatcherHealthy', () => {
    describe('when previousBlock is null', () => {
      it('returns true when currentBlock has transactions', () => {
        const currentBlock = createMockBlock('hash1', ['tx1', 'tx2'])
        expect(checkBatcherHealthy(null, currentBlock)).toBe(true)
      })

      it('returns false when currentBlock has no transactions', () => {
        const currentBlock = createMockBlock('hash1', [])
        expect(checkBatcherHealthy(null, currentBlock)).toBe(false)
      })
    })

    describe('when previousBlock exists', () => {
      describe('when parent_hash changed', () => {
        it('returns true indicating new block', () => {
          const previousBlock = createMockBlock('hash1', ['tx1'])
          const currentBlock = createMockBlock('hash2', ['tx1'])
          expect(checkBatcherHealthy(previousBlock, currentBlock)).toBe(true)
        })

        it('returns true even if no new transactions', () => {
          const previousBlock = createMockBlock('hash1', ['tx1', 'tx2'])
          const currentBlock = createMockBlock('hash2', [])
          expect(checkBatcherHealthy(previousBlock, currentBlock)).toBe(true)
        })
      })

      describe('when parent_hash is the same', () => {
        it('returns true when currentBlock has more transactions', () => {
          const previousBlock = createMockBlock('hash1', ['tx1', 'tx2'])
          const currentBlock = createMockBlock('hash1', ['tx1', 'tx2', 'tx3'])
          expect(checkBatcherHealthy(previousBlock, currentBlock)).toBe(true)
        })

        it('returns false when currentBlock has same number of transactions', () => {
          const previousBlock = createMockBlock('hash1', ['tx1', 'tx2'])
          const currentBlock = createMockBlock('hash1', ['tx1', 'tx2'])
          expect(checkBatcherHealthy(previousBlock, currentBlock)).toBe(false)
        })

        it('returns false when currentBlock has fewer transactions', () => {
          const previousBlock = createMockBlock('hash1', ['tx1', 'tx2', 'tx3'])
          const currentBlock = createMockBlock('hash1', ['tx1', 'tx2'])
          expect(checkBatcherHealthy(previousBlock, currentBlock)).toBe(false)
        })

        it('returns false when both have empty transactions', () => {
          const previousBlock = createMockBlock('hash1', [])
          const currentBlock = createMockBlock('hash1', [])
          expect(checkBatcherHealthy(previousBlock, currentBlock)).toBe(false)
        })
      })
    })
  })
})
