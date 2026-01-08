import {
  getConfirmations,
  hasMinConfirmations,
  sumConfirmedUtxos,
  sumPendingSpendInputs,
} from '../../src/lib/btc/por'
import { MempoolTransaction, UTXO } from '../../src/lib/btc/types'

const createUtxo = (overrides: Partial<UTXO> = {}): UTXO => ({
  txid: 'abc123',
  vout: 0,
  value: 1000000,
  status: { confirmed: true, block_height: 995 },
  ...overrides,
})

describe('BTC Reserves Calculation', () => {
  describe('getConfirmations', () => {
    it('should return correct confirmation count', () => {
      const utxo = createUtxo({ status: { confirmed: true, block_height: 995 } })
      expect(getConfirmations(utxo, 1000)).toBe(6) // 1000 - 995 + 1
    })

    it('should return 0 for unconfirmed UTXO', () => {
      const utxo = createUtxo({ status: { confirmed: false } })
      expect(getConfirmations(utxo, 1000)).toBe(0)
    })

    it('should return 0 for UTXO with missing block_height', () => {
      const utxo = createUtxo({ status: { confirmed: true } })
      expect(getConfirmations(utxo, 1000)).toBe(0)
    })

    it('should return 1 for UTXO at current block height', () => {
      const utxo = createUtxo({ status: { confirmed: true, block_height: 1000 } })
      expect(getConfirmations(utxo, 1000)).toBe(1)
    })
  })

  describe('hasMinConfirmations', () => {
    it('should return true when confirmations meet minimum', () => {
      const utxo = createUtxo({ status: { confirmed: true, block_height: 995 } })
      expect(hasMinConfirmations(utxo, 1000, 6)).toBe(true)
    })

    it('should return true when confirmations exceed minimum', () => {
      const utxo = createUtxo({ status: { confirmed: true, block_height: 990 } })
      expect(hasMinConfirmations(utxo, 1000, 6)).toBe(true)
    })

    it('should return false when confirmations below minimum', () => {
      const utxo = createUtxo({ status: { confirmed: true, block_height: 996 } })
      expect(hasMinConfirmations(utxo, 1000, 6)).toBe(false)
    })

    it('should return false for unconfirmed UTXO', () => {
      const utxo = createUtxo({ status: { confirmed: false } })
      expect(hasMinConfirmations(utxo, 1000, 6)).toBe(false)
    })
  })

  describe('sumConfirmedUtxos', () => {
    it('should sum only UTXOs with sufficient confirmations', () => {
      const utxos: UTXO[] = [
        createUtxo({ txid: 'tx1', value: 1000000, status: { confirmed: true, block_height: 995 } }), // 6 conf ✓
        createUtxo({ txid: 'tx2', value: 2000000, status: { confirmed: true, block_height: 996 } }), // 5 conf ✗
        createUtxo({ txid: 'tx3', value: 3000000, status: { confirmed: true, block_height: 994 } }), // 7 conf ✓
      ]
      expect(sumConfirmedUtxos(utxos, 1000, 6)).toBe(4000000n)
    })

    it('should exclude unconfirmed UTXOs', () => {
      const utxos: UTXO[] = [
        createUtxo({ value: 5000000, status: { confirmed: true, block_height: 990 } }),
        createUtxo({ value: 3000000, status: { confirmed: false } }),
      ]
      expect(sumConfirmedUtxos(utxos, 1000, 6)).toBe(5000000n)
    })

    it('should return 0n for empty UTXO list', () => {
      expect(sumConfirmedUtxos([], 1000, 6)).toBe(0n)
    })
  })

  describe('sumPendingSpendInputs', () => {
    const targetAddress = 'bc1ptest1234567890'

    it('should sum pending spend inputs from the target address', () => {
      const mempoolTxs: MempoolTransaction[] = [
        {
          txid: 'pending_tx',
          vin: [
            {
              txid: 'original_tx',
              vout: 0,
              prevout: { scriptpubkey_address: targetAddress, value: 5000000 },
            },
          ],
          vout: [],
        },
      ]
      expect(sumPendingSpendInputs(mempoolTxs, targetAddress)).toBe(5000000n)
    })

    it('should ignore inputs from other addresses', () => {
      const mempoolTxs: MempoolTransaction[] = [
        {
          txid: 'pending_tx',
          vin: [
            {
              txid: 'other_tx',
              vout: 0,
              prevout: { scriptpubkey_address: 'bc1pdifferent', value: 10000000 },
            },
          ],
          vout: [],
        },
      ]
      expect(sumPendingSpendInputs(mempoolTxs, targetAddress)).toBe(0n)
    })

    it('should sum across multiple transactions', () => {
      const mempoolTxs: MempoolTransaction[] = [
        {
          txid: 'tx1',
          vin: [
            {
              txid: 'a',
              vout: 0,
              prevout: { scriptpubkey_address: targetAddress, value: 3000000 },
            },
          ],
          vout: [],
        },
        {
          txid: 'tx2',
          vin: [
            {
              txid: 'b',
              vout: 0,
              prevout: { scriptpubkey_address: targetAddress, value: 2000000 },
            },
          ],
          vout: [],
        },
      ]
      expect(sumPendingSpendInputs(mempoolTxs, targetAddress)).toBe(5000000n)
    })

    it('should return 0n for empty mempool', () => {
      expect(sumPendingSpendInputs([], targetAddress)).toBe(0n)
    })
  })
})
