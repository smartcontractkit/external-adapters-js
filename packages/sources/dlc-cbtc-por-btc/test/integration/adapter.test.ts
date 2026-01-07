/**
 * Integration tests for the BTC PoR adapter
 *
 * These tests verify the full adapter flow with mocked external APIs.
 * Uses snapshot testing to detect unexpected response changes.
 *
 * Note: nock intercepts axios requests used by the framework's Requester.
 */

import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  MOCK_ATTESTER_API_URLS,
  MOCK_BITCOIN_RPC_URL,
  MOCK_BLOCK_HEIGHT,
  MOCK_CHAIN_NAME,
  MOCK_VAULT_ADDRESS,
} from './fixtures'

// Mock the address calculation module to bypass cryptographic verification
// Note: The requester parameter is ignored in the mock
jest.mock('../../src/lib/address', () => ({
  ...jest.requireActual('../../src/lib/address'),
  fetchAndCalculateVaultAddresses: jest.fn().mockResolvedValue({
    addresses: [MOCK_VAULT_ADDRESS],
    bitcoinNetwork: { bech32: 'tb', pubKeyHash: 0x6f, scriptHash: 0xc4, wif: 0xef },
  }),
}))

describe('BTC PoR Adapter Integration Tests', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['ATTESTER_API_URLS'] = MOCK_ATTESTER_API_URLS
    process.env['CHAIN_NAME'] = MOCK_CHAIN_NAME
    process.env['BITCOIN_RPC_ENDPOINT'] = MOCK_BITCOIN_RPC_URL
    process.env['MIN_CONFIRMATIONS'] = '6'
    process.env['BACKGROUND_EXECUTE_MS'] = '10000'

    const mockDate = new Date('2024-01-01T12:00:00.000Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    // Mock Bitcoin RPC endpoints using nock (works with axios used by Requester)
    nock(MOCK_BITCOIN_RPC_URL)
      .persist()
      .get('/blocks/tip/height')
      .reply(200, String(MOCK_BLOCK_HEIGHT))

    nock(MOCK_BITCOIN_RPC_URL)
      .persist()
      .get(`/address/${MOCK_VAULT_ADDRESS}/utxo`)
      .reply(200, [
        {
          txid: 'abc123def456',
          vout: 0,
          value: 500000000, // 5 BTC
          status: { confirmed: true, block_height: MOCK_BLOCK_HEIGHT - 10 },
        },
      ])

    nock(MOCK_BITCOIN_RPC_URL)
      .persist()
      .get(`/address/${MOCK_VAULT_ADDRESS}/txs/mempool`)
      .reply(200, [])

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

  describe('reserves endpoint', () => {
    it('should return total reserves in satoshis', async () => {
      const response = await testAdapter.request({ endpoint: 'reserves' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should work with por alias', async () => {
      const response = await testAdapter.request({ endpoint: 'por' })
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should use reserves as default endpoint', async () => {
      const response = await testAdapter.request({})
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
