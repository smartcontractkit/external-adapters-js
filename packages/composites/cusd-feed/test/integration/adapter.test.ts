import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import {
  MOCK_AUM_EQUAL,
  MOCK_AUM_HIGH,
  MOCK_AUM_LOW,
  MOCK_TOTAL_SUPPLY,
  mockPorResponseFailure400,
  mockPorResponseFailure500,
  mockPorResponseSuccess,
  mockPorResponseTimeout,
  mockPorResponseWithAum,
  mockPorResponseZeroAum,
} from './fixtures'

// Mock ethers before any imports - we'll control behavior per-test via mockImplementation
const mockTotalSupply = jest.fn()

jest.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: jest.fn().mockImplementation(() => ({})),
    Contract: jest.fn().mockImplementation(() => ({
      totalSupply: mockTotalSupply,
    })),
  },
}))

describe('execute', () => {
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let spy: jest.SpyInstance

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    // Mock time for deterministic snapshots
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    // Set required environment variables
    process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL ?? 'http://localhost:8545'
    process.env.ETHEREUM_CHAIN_ID = process.env.ETHEREUM_CHAIN_ID ?? '1'
    process.env.PROOF_OF_RESERVES_ADAPTER_URL =
      process.env.PROOF_OF_RESERVES_ADAPTER_URL ?? 'http://localhost:8081'
    process.env.BACKGROUND_EXECUTE_MS = '0'

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  beforeEach(() => {
    // Clear nock mocks from previous test
    nock.cleanAll()

    // Clear the EA cache before each test to prevent stale data
    const keys = testAdapter.mockCache?.cache.keys()
    if (keys) {
      for (const key of keys) {
        testAdapter.mockCache?.delete(key)
      }
    }

    // Reset mock - do NOT set default value here, let each test configure it
    mockTotalSupply.mockReset()
  })

  afterEach(async () => {
    // Clear nock mocks
    nock.cleanAll()

    // Clear the EA cache between tests
    const keys = testAdapter.mockCache?.cache.keys()
    if (keys) {
      for (const key of keys) {
        testAdapter.mockCache?.delete(key)
      }
    }

    // Small delay to ensure background executor has completed
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('price endpoint', () => {
    // IMPORTANT: Run failure tests that depend on ethers mock FIRST
    // to avoid caching issues where successful responses persist
    describe('upstream failures', () => {
      it('should return 502 when totalSupply is zero (cannot calculate ratio)', async () => {
        // Set zero totalSupply mock BEFORE any request to ensure the background executor uses it
        mockTotalSupply.mockResolvedValue(BigInt(0))
        mockPorResponseSuccess()
        const data = { endpoint: 'price' }

        await testAdapter.request(data)
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return 502 when proof-of-reserves adapter returns 500', async () => {
        mockTotalSupply.mockResolvedValue(MOCK_TOTAL_SUPPLY)
        mockPorResponseFailure500()
        const data = { endpoint: 'price' }

        await testAdapter.request(data)
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return 502 when proof-of-reserves adapter returns 400', async () => {
        mockTotalSupply.mockResolvedValue(MOCK_TOTAL_SUPPLY)
        mockPorResponseFailure400()
        const data = { endpoint: 'price' }

        await testAdapter.request(data)
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return 502 when proof-of-reserves adapter times out', async () => {
        mockTotalSupply.mockResolvedValue(MOCK_TOTAL_SUPPLY)
        mockPorResponseTimeout()
        const data = { endpoint: 'price' }

        await testAdapter.request(data)
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(502)
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('happy path', () => {
      it('should return success with correct ratio (1.05)', async () => {
        mockTotalSupply.mockResolvedValue(MOCK_TOTAL_SUPPLY)
        mockPorResponseSuccess()
        const data = { endpoint: 'price' }

        // First call triggers background execution
        await testAdapter.request(data)
        // Second call retrieves cached result
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return success for default endpoint', async () => {
        mockTotalSupply.mockResolvedValue(MOCK_TOTAL_SUPPLY)
        mockPorResponseSuccess()
        // Request without specifying endpoint uses default (price)
        await testAdapter.request({})
        const response = await testAdapter.request({})

        expect(response.statusCode).toBe(200)
        expect(response.json()).toMatchSnapshot()
      })

      it('should return correct response structure', async () => {
        mockTotalSupply.mockResolvedValue(MOCK_TOTAL_SUPPLY)
        mockPorResponseSuccess()
        await testAdapter.request({ endpoint: 'price' })
        const response = await testAdapter.request({ endpoint: 'price' })

        expect(response.statusCode).toBe(200)
        const json = response.json()

        // Verify response structure
        expect(json.data).toBeDefined()
        expect(json.data.result).toBe('1050000000000000000')
        expect(json.data.aum).toBe('10500000000000000000000000')
        expect(json.data.totalSupply).toBe('10000000000000000000000000')
        expect(json.data.ratio).toBe('1.05')
        expect(json.result).toBe('1050000000000000000')
        expect(json.statusCode).toBe(200)
      })

      it('should include timestamps in response', async () => {
        mockTotalSupply.mockResolvedValue(MOCK_TOTAL_SUPPLY)
        mockPorResponseSuccess()
        await testAdapter.request({ endpoint: 'price' })
        const response = await testAdapter.request({ endpoint: 'price' })

        expect(response.statusCode).toBe(200)
        const json = response.json()

        expect(json.timestamps).toBeDefined()
        expect(json.timestamps.providerDataRequestedUnixMs).toBeDefined()
        expect(json.timestamps.providerDataReceivedUnixMs).toBeDefined()
      })
    })

    describe('different AUM scenarios', () => {
      it('should calculate correct ratio for undercollateralized position (ratio < 1)', async () => {
        mockTotalSupply.mockResolvedValue(MOCK_TOTAL_SUPPLY)
        mockPorResponseWithAum(MOCK_AUM_LOW)
        const data = { endpoint: 'price' }

        await testAdapter.request(data)
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(200)
        const json = response.json()
        // 9M / 10M = 0.9, scaled by 1e18
        expect(json.data.result).toBe('900000000000000000')
        expect(json.data.ratio).toBe('0.9')
        expect(json.data.aum).toBe(MOCK_AUM_LOW)
        expect(response.json()).toMatchSnapshot()
      })

      it('should calculate correct ratio for highly collateralized position (ratio = 1.5)', async () => {
        mockTotalSupply.mockResolvedValue(MOCK_TOTAL_SUPPLY)
        mockPorResponseWithAum(MOCK_AUM_HIGH)
        const data = { endpoint: 'price' }

        await testAdapter.request(data)
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(200)
        const json = response.json()
        // 15M / 10M = 1.5, scaled by 1e18
        expect(json.data.result).toBe('1500000000000000000')
        expect(json.data.ratio).toBe('1.5')
        expect(json.data.aum).toBe(MOCK_AUM_HIGH)
        expect(response.json()).toMatchSnapshot()
      })

      it('should calculate correct ratio for exactly 1:1 collateralization (ratio = 1.0)', async () => {
        mockTotalSupply.mockResolvedValue(MOCK_TOTAL_SUPPLY)
        mockPorResponseWithAum(MOCK_AUM_EQUAL)
        const data = { endpoint: 'price' }

        await testAdapter.request(data)
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(200)
        const json = response.json()
        // 10M / 10M = 1.0, scaled by 1e18
        expect(json.data.result).toBe('1000000000000000000')
        expect(json.data.ratio).toBe('1')
        expect(json.data.aum).toBe(MOCK_AUM_EQUAL)
        expect(response.json()).toMatchSnapshot()
      })

      it('should handle zero AUM (ratio = 0)', async () => {
        mockTotalSupply.mockResolvedValue(MOCK_TOTAL_SUPPLY)
        mockPorResponseZeroAum()
        const data = { endpoint: 'price' }

        await testAdapter.request(data)
        const response = await testAdapter.request(data)

        expect(response.statusCode).toBe(200)
        const json = response.json()
        // 0 / 10M = 0, scaled by 1e18
        expect(json.data.result).toBe('0')
        expect(json.data.ratio).toBe('0')
        expect(response.json()).toMatchSnapshot()
      })
    })

    describe('validation', () => {
      it('should handle unknown endpoint gracefully', async () => {
        const data = { endpoint: 'unknown' }

        const response = await testAdapter.request(data)

        // Unknown endpoint returns 404 error
        expect(response.statusCode).toBe(404)
        expect(response.json()).toMatchSnapshot()
      })
    })
  })
})
