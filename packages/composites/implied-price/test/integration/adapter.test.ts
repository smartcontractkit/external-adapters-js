import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import nock from 'nock'
import {
  mockCoinbaseSuccess,
  mockCoingeckoSuccess,
  mockCoinpaprikaSuccess,
  mockFailingAdapter,
  mockTimeoutAdapter,
  mockZeroAdapterSuccess,
} from './fixtures'

describe('Computed Price Adapter', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    // Set up environment variables for source adapters
    process.env.COINGECKO_ADAPTER_URL = 'http://localhost:8080/coingecko'
    process.env.COINPAPRIKA_ADAPTER_URL = 'http://localhost:8080/coinpaprika'
    process.env.COINBASE_ADAPTER_URL = 'http://localhost:8080/coinbase'
    process.env.FAILING_ADAPTER_URL = 'http://localhost:8080/failing'
    process.env.ZERO_ADAPTER_URL = 'http://localhost:8080/zero-adapter'
    process.env.TIMEOUT_ADAPTER_URL = 'http://localhost:8080/timeout'
    process.env.BACKGROUND_EXECUTE_MS = '100' // Reduce background execution frequency
    process.env.CACHE_MAX_AGE = '30000' // Longer cache to reduce redundant calls

    // Disable network connections to ensure tests use mocks
    nock.disableNetConnect()

    // Reduce log noise in tests
    process.env.LOG_LEVEL = 'error'

    // Mock Date.now for consistent timestamps
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('../../src')).adapter as unknown as Adapter
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
    nock.enableNetConnect()
    spy.mockRestore()
  })

  beforeEach(() => {
    // Setup all mocks for each test
    mockCoingeckoSuccess()
    mockCoinpaprikaSuccess()
    mockCoinbaseSuccess()
    mockZeroAdapterSuccess()
    mockFailingAdapter()
    mockTimeoutAdapter()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  describe('v2 Backward Compatibility', () => {
    it('should work with operand1/operand2 format (v2 computedPrice endpoint)', async () => {
      const response = await testAdapter.request({
        endpoint: 'computedPrice',
        operand1Sources: ['coingecko', 'coinpaprika'],
        operand2Sources: ['coingecko', 'coinpaprika'],
        operand1Input: JSON.stringify({
          base: 'ETH',
          quote: 'USD',
        }),
        operand2Input: JSON.stringify({
          base: 'BTC',
          quote: 'USD',
        }),
        operation: 'divide',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result.result).toBeDefined()
      expect(typeof result.result).toBe('number')
      expect(result.data.result).toBe(result.result)
    })

    it('should work with dividend/divisor format (v2 impliedPrice endpoint)', async () => {
      const response = await testAdapter.request({
        dividendSources: ['coingecko', 'coinpaprika'],
        divisorSources: ['coingecko', 'coinpaprika'],
        dividendInput: JSON.stringify({
          base: 'ETH',
          quote: 'USD',
        }),
        divisorInput: JSON.stringify({
          base: 'BTC',
          quote: 'USD',
        }),
        operation: 'divide',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result.result).toBeDefined()
      expect(typeof result.result).toBe('number')
      expect(result.data.result).toBe(result.result)
    })

    it('should default to divide operation when operation parameter is omitted (impliedPrice compatibility)', async () => {
      const response = await testAdapter.request({
        dividendSources: ['coingecko'],
        divisorSources: ['coingecko'],
        dividendInput: JSON.stringify({
          from: 'LINK',
          to: 'USD',
        }),
        divisorInput: JSON.stringify({
          from: 'ETH',
          to: 'USD',
        }),
        // No operation parameter - should default to 'divide'
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result.result).toBeDefined()
      expect(typeof result.result).toBe('number')
    })

    it('should work with operand1/operand2 multiply operation', async () => {
      const response = await testAdapter.request({
        endpoint: 'computedPrice',
        operand1Sources: ['coingecko'],
        operand2Sources: ['coinpaprika'],
        operand1Input: JSON.stringify({
          from: 'ETH',
          to: 'USD',
        }),
        operand2Input: JSON.stringify({
          from: 'BTC',
          to: 'USD',
        }),
        operation: 'multiply',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result.result).toBeDefined()
      expect(typeof result.result).toBe('number')
    })
  })

  describe('computedPrice endpoint', () => {
    it('should calculate computed price with base/quote format (JSON string input) - divide', async () => {
      const response = await testAdapter.request({
        dividendSources: ['coingecko', 'coinpaprika'],
        divisorSources: ['coingecko', 'coinpaprika'],
        dividendInput: JSON.stringify({
          base: 'ETH',
          quote: 'USD',
        }),
        divisorInput: JSON.stringify({
          base: 'BTC',
          quote: 'USD',
        }),
        operation: 'divide',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      // With mock data: coingecko=4400.05, coinpaprika=4400.15 -> median 4400.1
      expect(result.result).toBeDefined()
      expect(typeof result.result).toBe('number')
      expect(result.data.result).toBe(result.result)
    })

    it('should calculate computed price with base/quote format (JSON string input) - multiply', async () => {
      const response = await testAdapter.request({
        dividendSources: ['coingecko', 'coinpaprika'],
        divisorSources: ['coingecko', 'coinpaprika'],
        dividendInput: JSON.stringify({
          base: 'ETH',
          quote: 'USD',
        }),
        divisorInput: JSON.stringify({
          base: 'BTC',
          quote: 'USD',
        }),
        operation: 'multiply',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      // With multiplication: ETH median * BTC median
      expect(result.result).toBeDefined()
      expect(typeof result.result).toBe('number')
      expect(result.data.result).toBe(result.result)
    })

    it('should calculate computed price with from/to format - divide', async () => {
      const response = await testAdapter.request({
        dividendSources: ['coingecko', 'coinpaprika'],
        divisorSources: ['coingecko', 'coinpaprika'],
        dividendInput: JSON.stringify({
          from: 'LINK',
          to: 'USD',
        }),
        divisorInput: JSON.stringify({
          from: 'ETH',
          to: 'USD',
        }),
        operation: 'divide',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result.result).toBeDefined()
      expect(typeof result.result).toBe('number')
    })

    it('should work with overrides - multiply', async () => {
      const response = await testAdapter.request({
        dividendSources: ['coingecko'],
        divisorSources: ['coingecko'],
        dividendInput: JSON.stringify({
          base: 'ETH',
          quote: 'USD',
          overrides: {
            coingecko: {
              ETH: 'ethereum',
            },
          },
        }),
        divisorInput: JSON.stringify({
          base: 'BTC',
          quote: 'USD',
          overrides: {
            coingecko: {
              BTC: 'bitcoin',
            },
          },
        }),
        operation: 'multiply',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result.result).toBeDefined()
      expect(typeof result.result).toBe('number')
    })

    it('should handle minimum answers requirement', async () => {
      const response = await testAdapter.request({
        dividendSources: ['coingecko', 'coinpaprika', 'coinbase'],
        divisorSources: ['coingecko', 'coinpaprika', 'coinbase'],
        dividendMinAnswers: 2,
        divisorMinAnswers: 2,
        dividendInput: JSON.stringify({
          base: 'ETH',
          quote: 'USD',
        }),
        divisorInput: JSON.stringify({
          base: 'BTC',
          quote: 'USD',
        }),
        operation: 'divide',
      })

      expect(response.statusCode).toBe(200)
      const result = response.json()
      expect(result.result).toBeDefined()
      expect(typeof result.result).toBe('number')
    })

    it('should handle missing required parameters (missing dividend sources)', async () => {
      const response = await testAdapter.request({
        // Missing dividendSources (required for impliedPrice endpoint)
        divisorSources: ['coingecko'],
        dividendInput: JSON.stringify({
          base: 'ETH',
          quote: 'USD',
        }),
        divisorInput: JSON.stringify({
          base: 'BTC',
          quote: 'USD',
        }),
        operation: 'divide',
      })

      expect(response.statusCode).toBe(400) // Validation error
      const result = response.json()
      expect(result.message || result.errorMessage || JSON.stringify(result)).toContain(
        'dividendSources',
      )
    })

    it('should handle invalid operation parameter', async () => {
      const response = await testAdapter.request({
        dividendSources: ['coingecko'],
        divisorSources: ['coingecko'],
        dividendInput: JSON.stringify({
          base: 'ETH',
          quote: 'USD',
        }),
        divisorInput: JSON.stringify({
          base: 'BTC',
          quote: 'USD',
        }),
        operation: 'invalid_operation',
      })

      expect(response.statusCode).toBe(400)
      const result = response.json()
      expect(result.message || result.errorMessage || JSON.stringify(result)).toContain('operation')
    })

    it('should validate JSON input parameters', async () => {
      const response = await testAdapter.request({
        dividendSources: ['coingecko'],
        divisorSources: ['coingecko'],
        dividendInput: 'invalid-json-string',
        divisorInput: JSON.stringify({
          base: 'BTC',
          quote: 'USD',
        }),
        operation: 'divide',
      })

      expect(response.statusCode).toBe(400) // Validation error for JSON parsing
      const result = response.json()
      expect(result.message || result.errorMessage || JSON.stringify(result)).toContain(
        'dividendInput',
      )
    })

    it('should handle malformed JSON with descriptive error', async () => {
      const response = await testAdapter.request({
        dividendSources: ['coingecko'],
        divisorSources: ['coingecko'],
        dividendInput: '{"base": "ETH", "quote":}', // Malformed JSON
        divisorInput: JSON.stringify({
          base: 'BTC',
          quote: 'USD',
        }),
        operation: 'divide',
      })

      expect(response.statusCode).toBe(400) // Validation error
      const result = response.json()
      expect(result.message || result.errorMessage || JSON.stringify(result)).toContain(
        'dividendInput',
      )
    })

    it('should handle division by zero scenario (insufficient responses from zero-adapter)', async () => {
      const response = await testAdapter.request({
        dividendSources: ['coingecko'],
        divisorSources: ['zero-adapter'],
        dividendInput: JSON.stringify({ base: 'ETH', quote: 'USD' }),
        divisorInput: JSON.stringify({ base: 'ZERO', quote: 'USD' }),
        operation: 'divide',
      })

      expect(response.statusCode).toBe(400) // Insufficient responses error
      const result = response.json()
      expect(result.message || result.errorMessage || JSON.stringify(result)).toContain(
        'Insufficient responses',
      )
    })
  })
})
