import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'

const MOCK_ADDRESS = 'bc1ptest1234567890'
const MOCK_BLOCK_HEIGHT = 1000

describe('reserves confirmation logic', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['BITCOIN_RPC_ENDPOINT'] = 'https://test.electrs.api'
    process.env['VAULT_ADDRESSES'] = MOCK_ADDRESS
    process.env['MIN_CONFIRMATIONS'] = '6'

    const mockDate = new Date('2024-01-01T12:00:00.000Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  const mockBlockHeight = (height: number) => {
    nock('https://test.electrs.api').get('/blocks/tip/height').reply(200, String(height)).persist()
  }

  const mockUtxos = (utxos: unknown[]) => {
    nock('https://test.electrs.api')
      .get(`/address/${MOCK_ADDRESS}/utxo`)
      .reply(200, utxos)
      .persist()
  }

  const mockMempool = (txs: unknown[] = []) => {
    nock('https://test.electrs.api')
      .get(`/address/${MOCK_ADDRESS}/txs/mempool`)
      .reply(200, txs)
      .persist()
  }

  describe('confirmation counting', () => {
    it('should only count UTXOs with 6+ confirmations', async () => {
      mockBlockHeight(MOCK_BLOCK_HEIGHT)
      mockUtxos([
        // Block 995: 1000 - 995 + 1 = 6 confirmations ✓
        { txid: 'tx1', vout: 0, value: 1000000, status: { confirmed: true, block_height: 995 } },
        // Block 996: 1000 - 996 + 1 = 5 confirmations ✗
        { txid: 'tx2', vout: 0, value: 2000000, status: { confirmed: true, block_height: 996 } },
        // Block 994: 1000 - 994 + 1 = 7 confirmations ✓
        { txid: 'tx3', vout: 0, value: 3000000, status: { confirmed: true, block_height: 994 } },
        // Block 999: 1000 - 999 + 1 = 2 confirmations ✗
        { txid: 'tx4', vout: 0, value: 4000000, status: { confirmed: true, block_height: 999 } },
      ])
      mockMempool()

      const response = await testAdapter.request({ endpoint: 'reserves' })
      expect(response.statusCode).toBe(200)

      // Should only count tx1 (1M) + tx3 (3M) = 4M sats
      const json = response.json()
      expect(json.result).toBe(4000000)
    })

    it('should exclude unconfirmed UTXOs', async () => {
      mockBlockHeight(MOCK_BLOCK_HEIGHT)
      mockUtxos([
        // Confirmed with 10 confirmations
        { txid: 'tx1', vout: 0, value: 5000000, status: { confirmed: true, block_height: 991 } },
        // Unconfirmed (still in mempool)
        { txid: 'tx2', vout: 0, value: 3000000, status: { confirmed: false } },
        // Confirmed with 6 confirmations
        { txid: 'tx3', vout: 0, value: 2000000, status: { confirmed: true, block_height: 995 } },
      ])
      mockMempool()

      const response = await testAdapter.request({ endpoint: 'reserves' })
      expect(response.statusCode).toBe(200)

      // Should only count tx1 (5M) + tx3 (2M) = 7M sats
      const json = response.json()
      expect(json.result).toBe(7000000)
    })

    it('should handle edge case of exactly 6 confirmations', async () => {
      mockBlockHeight(MOCK_BLOCK_HEIGHT)
      mockUtxos([
        // Exactly 6 confirmations: 1000 - 995 + 1 = 6 ✓
        { txid: 'tx1', vout: 0, value: 1000000, status: { confirmed: true, block_height: 995 } },
      ])
      mockMempool()

      const response = await testAdapter.request({ endpoint: 'reserves' })
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(1000000)
    })

    it('should handle edge case of 5 confirmations (just below threshold)', async () => {
      mockBlockHeight(MOCK_BLOCK_HEIGHT)
      mockUtxos([
        // 5 confirmations: 1000 - 996 + 1 = 5 ✗
        { txid: 'tx1', vout: 0, value: 1000000, status: { confirmed: true, block_height: 996 } },
      ])
      mockMempool()

      const response = await testAdapter.request({ endpoint: 'reserves' })
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(0)
    })
  })

  describe('pending spend handling', () => {
    it('should add pending spend input values', async () => {
      mockBlockHeight(MOCK_BLOCK_HEIGHT)
      // Original UTXO was spent
      mockUtxos([])
      // But there's a pending tx spending from this address
      mockMempool([
        {
          txid: 'pending_tx',
          vin: [
            {
              txid: 'original_tx',
              vout: 0,
              prevout: {
                scriptpubkey_address: MOCK_ADDRESS,
                value: 5000000,
              },
            },
          ],
          vout: [
            { scriptpubkey_address: 'bc1qrecipient', value: 3000000 },
            { scriptpubkey_address: MOCK_ADDRESS, value: 2000000 },
          ],
        },
      ])

      const response = await testAdapter.request({ endpoint: 'reserves' })
      expect(response.statusCode).toBe(200)

      // Should count the 5M from the pending spend input
      expect(response.json().result).toBe(5000000)
    })

    it('should combine confirmed UTXOs and pending spend inputs', async () => {
      mockBlockHeight(MOCK_BLOCK_HEIGHT)
      // One confirmed UTXO
      mockUtxos([
        {
          txid: 'confirmed_tx',
          vout: 0,
          value: 10000000,
          status: { confirmed: true, block_height: 990 },
        },
      ])
      // Plus a pending tx spending from another UTXO
      mockMempool([
        {
          txid: 'pending_tx',
          vin: [
            {
              txid: 'another_tx',
              vout: 0,
              prevout: {
                scriptpubkey_address: MOCK_ADDRESS,
                value: 3000000,
              },
            },
          ],
          vout: [],
        },
      ])

      const response = await testAdapter.request({ endpoint: 'reserves' })
      expect(response.statusCode).toBe(200)

      // Should count 10M confirmed + 3M pending = 13M
      expect(response.json().result).toBe(13000000)
    })

    it('should ignore pending tx inputs from other addresses', async () => {
      mockBlockHeight(MOCK_BLOCK_HEIGHT)
      mockUtxos([
        { txid: 'tx1', vout: 0, value: 5000000, status: { confirmed: true, block_height: 990 } },
      ])
      // Pending tx with input from a DIFFERENT address
      mockMempool([
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
      ])

      const response = await testAdapter.request({ endpoint: 'reserves' })
      expect(response.statusCode).toBe(200)

      // Should only count the 5M confirmed, not the 10M from other address
      expect(response.json().result).toBe(5000000)
    })
  })

  describe('empty states', () => {
    it('should return 0 for address with no UTXOs', async () => {
      mockBlockHeight(MOCK_BLOCK_HEIGHT)
      mockUtxos([])
      mockMempool([])

      const response = await testAdapter.request({ endpoint: 'reserves' })
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(0)
    })

    it('should return 0 when all UTXOs have insufficient confirmations', async () => {
      mockBlockHeight(MOCK_BLOCK_HEIGHT)
      mockUtxos([
        { txid: 'tx1', vout: 0, value: 1000000, status: { confirmed: true, block_height: 998 } },
        { txid: 'tx2', vout: 0, value: 2000000, status: { confirmed: true, block_height: 999 } },
        { txid: 'tx3', vout: 0, value: 3000000, status: { confirmed: false } },
      ])
      mockMempool([])

      const response = await testAdapter.request({ endpoint: 'reserves' })
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(0)
    })
  })
})
