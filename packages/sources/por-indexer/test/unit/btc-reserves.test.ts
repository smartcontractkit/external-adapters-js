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

describe('BTC reserves calculation', () => {
  describe('getConfirmations', () => {
    it('should return correct confirmation count', () => {
      const utxo = createUtxo({ status: { confirmed: true, block_height: 995 } })
      expect(getConfirmations(utxo, 1000)).toBe(6)
    })

    it('should return 0 for unconfirmed UTXO', () => {
      const utxo = createUtxo({ status: { confirmed: false } })
      expect(getConfirmations(utxo, 1000)).toBe(0)
    })
  })

  describe('hasMinConfirmations', () => {
    it('should return true when confirmations meet minimum', () => {
      const utxo = createUtxo({ status: { confirmed: true, block_height: 995 } })
      expect(hasMinConfirmations(utxo, 1000, 6)).toBe(true)
    })

    it('should return false when confirmations below minimum', () => {
      const utxo = createUtxo({ status: { confirmed: true, block_height: 996 } })
      expect(hasMinConfirmations(utxo, 1000, 6)).toBe(false)
    })
  })

  describe('sumConfirmedUtxos', () => {
    it('should sum only UTXOs with sufficient confirmations', () => {
      const utxos: UTXO[] = [
        createUtxo({ txid: 'tx1', value: 1000000, status: { confirmed: true, block_height: 995 } }),
        createUtxo({ txid: 'tx2', value: 2000000, status: { confirmed: true, block_height: 996 } }),
        createUtxo({ txid: 'tx3', value: 3000000, status: { confirmed: true, block_height: 994 } }),
      ]
      expect(sumConfirmedUtxos(utxos, 1000, 6)).toBe(4000000n)
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
  })
})
