/**
 * Integration tests for the BTC PoR adapter
 *
 * These tests verify the full adapter flow with mocked external APIs.
 * Uses snapshot testing to detect unexpected response changes.
 *
 * Note: Uses global fetch mocking since nock doesn't intercept Node.js native fetch.
 */

import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  MOCK_ATTESTER_API_URL,
  MOCK_BITCOIN_NETWORK,
  MOCK_BITCOIN_RPC_URL,
  MOCK_BLOCK_HEIGHT,
  MOCK_VAULT_ADDRESS,
} from './fixtures'

// Store the original fetch
const originalFetch = global.fetch

// Mock fetch responses
const mockFetchResponses: Record<string, { status: number; body: unknown }> = {}

const mockFetch = jest.fn((url: string) => {
  const response = mockFetchResponses[url]
  if (response) {
    return Promise.resolve({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: () => Promise.resolve(response.body),
    })
  }
  return Promise.reject(new Error(`No mock for ${url}`))
})

// Mock the address calculation module to bypass cryptographic verification
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
    process.env['ATTESTER_API_URL'] = MOCK_ATTESTER_API_URL
    process.env['BITCOIN_NETWORK'] = MOCK_BITCOIN_NETWORK
    process.env['BITCOIN_RPC_ENDPOINT'] = MOCK_BITCOIN_RPC_URL
    process.env['MIN_CONFIRMATIONS'] = '6'
    process.env['BACKGROUND_EXECUTE_MS'] = '10000'

    const mockDate = new Date('2024-01-01T12:00:00.000Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    // Set up mock fetch responses for Bitcoin RPC
    mockFetchResponses[`${MOCK_BITCOIN_RPC_URL}/blocks/tip/height`] = {
      status: 200,
      body: MOCK_BLOCK_HEIGHT,
    }

    mockFetchResponses[`${MOCK_BITCOIN_RPC_URL}/address/${MOCK_VAULT_ADDRESS}/utxo`] = {
      status: 200,
      body: [
        {
          txid: 'abc123def456',
          vout: 0,
          value: 500000000, // 5 BTC
          status: { confirmed: true, block_height: MOCK_BLOCK_HEIGHT - 10 },
        },
      ],
    }

    mockFetchResponses[`${MOCK_BITCOIN_RPC_URL}/address/${MOCK_VAULT_ADDRESS}/txs/mempool`] = {
      status: 200,
      body: [],
    }

    // Replace global fetch with our mock
    global.fetch = mockFetch as unknown as typeof fetch

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    // Restore original fetch
    global.fetch = originalFetch
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
