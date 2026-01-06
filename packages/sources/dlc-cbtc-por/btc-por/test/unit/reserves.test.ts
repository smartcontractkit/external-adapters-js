/**
 * Unit tests for the reserves calculation logic.
 *
 * Tests pure functions for UTXO processing, confirmation counting,
 * and pending spend handling. No mocking required.
 */

import {
  buildUrl,
  getConfirmations,
  hasMinConfirmations,
  sumConfirmedUtxos,
  sumPendingSpendInputs,
} from '../../src/lib/por'
import { MempoolTransaction, UTXO } from '../../src/lib/types'

describe('Reserves Calculation Logic', () => {
  describe('buildUrl', () => {
    it('should append path to simple base URL', () => {
      expect(buildUrl('https://api.example.com', '/blocks/tip/height')).toBe(
        'https://api.example.com/blocks/tip/height',
      )
    })

    it('should append path to base URL with existing path', () => {
      expect(buildUrl('https://api.example.com/electrs', '/blocks/tip/height')).toBe(
        'https://api.example.com/electrs/blocks/tip/height',
      )
    })

    it('should preserve query parameters at the end', () => {
      expect(buildUrl('https://api.example.com/electrs?auth=TOKEN', '/blocks/tip/height')).toBe(
        'https://api.example.com/electrs/blocks/tip/height?auth=TOKEN',
      )
    })

    it('should handle trailing slash in base URL', () => {
      expect(buildUrl('https://api.example.com/', '/blocks/tip/height')).toBe(
        'https://api.example.com/blocks/tip/height',
      )
    })

    it('should handle complex paths with address', () => {
      expect(buildUrl('https://api.example.com?auth=TOKEN', '/address/bc1ptest/utxo')).toBe(
        'https://api.example.com/address/bc1ptest/utxo?auth=TOKEN',
      )
    })

    it('should work with LinkPool URL format', () => {
      const base = 'https://esplora-mainnet-cll.public.linkpool.io/LajIammVAhn6mrx1ZNJRybxXdXCKI0Us'
      expect(buildUrl(base, '/blocks/tip/height')).toBe(
        'https://esplora-mainnet-cll.public.linkpool.io/LajIammVAhn6mrx1ZNJRybxXdXCKI0Us/blocks/tip/height',
      )
    })

    it('should work with SimplyVC URL format', () => {
      const base =
        'https://spectrum-cl-02.simplystaking.xyz/Y2hhaW5saW5rLTAyLWVhNDQ2OTRlLWNoYWlubGluaw/i_LbnLpLZ3qY1w/bitcoin/mainnet'
      expect(buildUrl(base, '/blocks/tip/height')).toBe(
        'https://spectrum-cl-02.simplystaking.xyz/Y2hhaW5saW5rLTAyLWVhNDQ2OTRlLWNoYWlubGluaw/i_LbnLpLZ3qY1w/bitcoin/mainnet/blocks/tip/height',
      )
    })

    it('should work with MatrixedLink URL format (with query param)', () => {
      const base = 'https://mainnet.hemi.eu.endpoints.matrixed.link/electrs?auth=CL-AGspET6yfg2X'
      expect(buildUrl(base, '/blocks/tip/height')).toBe(
        'https://mainnet.hemi.eu.endpoints.matrixed.link/electrs/blocks/tip/height?auth=CL-AGspET6yfg2X',
      )
    })
  })

  describe('getConfirmations', () => {
    it('should return correct confirmation count for confirmed UTXO', () => {
      const utxo: UTXO = {
        txid: 'abc123',
        vout: 0,
        value: 1000000,
        status: { confirmed: true, block_height: 995 },
      }
      // 1000 - 995 + 1 = 6 confirmations
      expect(getConfirmations(utxo, 1000)).toBe(6)
    })

    it('should return 0 for unconfirmed UTXO', () => {
      const utxo: UTXO = {
        txid: 'abc123',
        vout: 0,
        value: 1000000,
        status: { confirmed: false },
      }
      expect(getConfirmations(utxo, 1000)).toBe(0)
    })

    it('should return 0 for UTXO with missing block_height', () => {
      const utxo: UTXO = {
        txid: 'abc123',
        vout: 0,
        value: 1000000,
        status: { confirmed: true },
      }
      expect(getConfirmations(utxo, 1000)).toBe(0)
    })

    it('should return 1 for UTXO at current block height', () => {
      const utxo: UTXO = {
        txid: 'abc123',
        vout: 0,
        value: 1000000,
        status: { confirmed: true, block_height: 1000 },
      }
      expect(getConfirmations(utxo, 1000)).toBe(1)
    })
  })

  describe('hasMinConfirmations', () => {
    it('should return true when confirmations meet minimum', () => {
      const utxo: UTXO = {
        txid: 'abc123',
        vout: 0,
        value: 1000000,
        status: { confirmed: true, block_height: 995 },
      }
      // 6 confirmations, min 6 = true
      expect(hasMinConfirmations(utxo, 1000, 6)).toBe(true)
    })

    it('should return true when confirmations exceed minimum', () => {
      const utxo: UTXO = {
        txid: 'abc123',
        vout: 0,
        value: 1000000,
        status: { confirmed: true, block_height: 990 },
      }
      // 11 confirmations, min 6 = true
      expect(hasMinConfirmations(utxo, 1000, 6)).toBe(true)
    })

    it('should return false when confirmations below minimum', () => {
      const utxo: UTXO = {
        txid: 'abc123',
        vout: 0,
        value: 1000000,
        status: { confirmed: true, block_height: 996 },
      }
      // 5 confirmations, min 6 = false
      expect(hasMinConfirmations(utxo, 1000, 6)).toBe(false)
    })

    it('should return false for unconfirmed UTXO', () => {
      const utxo: UTXO = {
        txid: 'abc123',
        vout: 0,
        value: 1000000,
        status: { confirmed: false },
      }
      expect(hasMinConfirmations(utxo, 1000, 6)).toBe(false)
    })
  })

  describe('sumConfirmedUtxos', () => {
    const currentBlockHeight = 1000
    const minConfirmations = 6

    it('should sum only UTXOs with sufficient confirmations', () => {
      const utxos: UTXO[] = [
        // 6 confirmations ✓
        { txid: 'tx1', vout: 0, value: 1000000, status: { confirmed: true, block_height: 995 } },
        // 5 confirmations ✗
        { txid: 'tx2', vout: 0, value: 2000000, status: { confirmed: true, block_height: 996 } },
        // 7 confirmations ✓
        { txid: 'tx3', vout: 0, value: 3000000, status: { confirmed: true, block_height: 994 } },
        // 2 confirmations ✗
        { txid: 'tx4', vout: 0, value: 4000000, status: { confirmed: true, block_height: 999 } },
      ]

      // tx1 (1M) + tx3 (3M) = 4M (returns BigInt)
      expect(sumConfirmedUtxos(utxos, currentBlockHeight, minConfirmations)).toBe(4000000n)
    })

    it('should exclude unconfirmed UTXOs', () => {
      const utxos: UTXO[] = [
        { txid: 'tx1', vout: 0, value: 5000000, status: { confirmed: true, block_height: 990 } },
        { txid: 'tx2', vout: 0, value: 3000000, status: { confirmed: false } },
        { txid: 'tx3', vout: 0, value: 2000000, status: { confirmed: true, block_height: 995 } },
      ]

      // tx1 (5M) + tx3 (2M) = 7M
      expect(sumConfirmedUtxos(utxos, currentBlockHeight, minConfirmations)).toBe(7000000n)
    })

    it('should return 0n for empty UTXO list', () => {
      expect(sumConfirmedUtxos([], currentBlockHeight, minConfirmations)).toBe(0n)
    })

    it('should return 0n when no UTXOs meet confirmation requirement', () => {
      const utxos: UTXO[] = [
        { txid: 'tx1', vout: 0, value: 1000000, status: { confirmed: true, block_height: 998 } },
        { txid: 'tx2', vout: 0, value: 2000000, status: { confirmed: false } },
      ]

      expect(sumConfirmedUtxos(utxos, currentBlockHeight, minConfirmations)).toBe(0n)
    })

    it('should handle exactly 6 confirmations (edge case)', () => {
      const utxos: UTXO[] = [
        { txid: 'tx1', vout: 0, value: 1000000, status: { confirmed: true, block_height: 995 } },
      ]

      expect(sumConfirmedUtxos(utxos, currentBlockHeight, minConfirmations)).toBe(1000000n)
    })

    it('should handle 5 confirmations (just below threshold)', () => {
      const utxos: UTXO[] = [
        { txid: 'tx1', vout: 0, value: 1000000, status: { confirmed: true, block_height: 996 } },
      ]

      expect(sumConfirmedUtxos(utxos, currentBlockHeight, minConfirmations)).toBe(0n)
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
              prevout: {
                scriptpubkey_address: targetAddress,
                value: 5000000,
              },
            },
          ],
          vout: [{ scriptpubkey_address: 'bc1qrecipient', value: 4500000 }],
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
              prevout: {
                scriptpubkey_address: 'bc1pdifferentaddress',
                value: 10000000,
              },
            },
          ],
          vout: [],
        },
      ]

      expect(sumPendingSpendInputs(mempoolTxs, targetAddress)).toBe(0n)
    })

    it('should sum multiple inputs from target address', () => {
      const mempoolTxs: MempoolTransaction[] = [
        {
          txid: 'pending_tx',
          vin: [
            {
              txid: 'tx1',
              vout: 0,
              prevout: { scriptpubkey_address: targetAddress, value: 3000000 },
            },
            {
              txid: 'tx2',
              vout: 0,
              prevout: { scriptpubkey_address: targetAddress, value: 2000000 },
            },
          ],
          vout: [],
        },
      ]

      expect(sumPendingSpendInputs(mempoolTxs, targetAddress)).toBe(5000000n)
    })

    it('should sum across multiple transactions', () => {
      const mempoolTxs: MempoolTransaction[] = [
        {
          txid: 'pending_tx1',
          vin: [
            {
              txid: 'tx1',
              vout: 0,
              prevout: { scriptpubkey_address: targetAddress, value: 3000000 },
            },
          ],
          vout: [],
        },
        {
          txid: 'pending_tx2',
          vin: [
            {
              txid: 'tx2',
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

    it('should handle mixed inputs (some from target, some from others)', () => {
      const mempoolTxs: MempoolTransaction[] = [
        {
          txid: 'pending_tx',
          vin: [
            {
              txid: 'tx1',
              vout: 0,
              prevout: { scriptpubkey_address: targetAddress, value: 5000000 },
            },
            {
              txid: 'tx2',
              vout: 0,
              prevout: { scriptpubkey_address: 'bc1pother', value: 3000000 },
            },
          ],
          vout: [],
        },
      ]

      // Only count the input from target address (returns BigInt)
      expect(sumPendingSpendInputs(mempoolTxs, targetAddress)).toBe(5000000n)
    })
  })
})
