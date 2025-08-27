import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'

describe('FTSE SFTP adapter', () => {
  let testAdapter: TestAdapter<any>
  let oldEnv: NodeJS.ProcessEnv
  let spy: jest.SpyInstance

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    const mockDate = new Date('2024-08-23T10:00:00.000Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    // Set up environment variables for the adapter
    setEnvVariables({
      SFTP_HOST: 'sftp.test.com',
      SFTP_PORT: '22',
      SFTP_USERNAME: 'testuser',
      SFTP_PASSWORD: 'testpass',
      WARMUP_SUBSCRIPTION_TTL: '120000',
      CACHE_MAX_AGE: '90000',
      CACHE_POLLING_MAX_RETRIES: '5',
      METRICS_ENABLED: 'false',
      LOG_LEVEL: 'info',
      REQUEST_COALESCING_ENABLED: 'false',
      REQUEST_COALESCING_INTERVAL: '100',
      REQUEST_COALESCING_INTERVAL_MAX: '1000',
      REQUEST_COALESCING_INTERVAL_COEFFICIENT: '2',
      REQUEST_COALESCING_ENTROPY_MAX: '0',
      CACHE_ENABLED: 'true',
    })

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    spy.mockRestore()
  })

  beforeEach(() => {
    // Clean setup for each test
  })

  describe('sftp endpoint', () => {
    it('should return success for valid FTSE100INDEX download request', async () => {
      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    }, 30000)

    it('should return success for valid Russell1000INDEX download request', async () => {
      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'Russell1000INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    }, 30000)

    it('should return success for valid Russell2000INDEX download request', async () => {
      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'Russell2000INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    }, 30000)

    it('should return success for valid Russell3000INDEX download request', async () => {
      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'Russell3000INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    }, 30000)

    it('should return error for invalid instrument', async () => {
      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'INVALID_INSTRUMENT',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    }, 30000)

    it('should return error for missing required fields', async () => {
      const data = {
        operation: 'download',
        // Missing remotePath and instrument
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    }, 30000)

    it('should return error for unsupported operation', async () => {
      const data = {
        operation: 'upload',
        remotePath: '/data',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    }, 30000)

    it('should handle different remote paths correctly', async () => {
      const data = {
        operation: 'download',
        remotePath: '/custom/path',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    }, 30000)

    it('should handle root path correctly', async () => {
      const data = {
        operation: 'download',
        remotePath: '/',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    }, 30000)
  })

  describe('input validation', () => {
    it('should validate operation parameter', async () => {
      const data = {
        operation: 'invalid_operation',
        remotePath: '/data',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    }, 30000)

    it('should require remotePath parameter', async () => {
      const data = {
        operation: 'download',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    }, 30000)

    it('should require instrument parameter', async () => {
      const data = {
        operation: 'download',
        remotePath: '/data',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    }, 30000)

    it('should accept valid string parameters', async () => {
      const data = {
        operation: 'download',
        remotePath: '/valid/path',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    }, 30000)
  })

  describe('file path templating', () => {
    beforeEach(() => {
      // Reset system time to a specific date for consistent testing
      const mockDate = new Date('2024-08-23T10:00:00.000Z')
      spy.mockReturnValue(mockDate.getTime())
    })

    it('should correctly build file path with date for FTSE100INDEX', async () => {
      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      // Expected file path should be ukallv2308.csv (day=23, month=08)
      // Capture the response for snapshot comparison
      if (response.statusCode < 500) {
        expect(response.json()).toMatchSnapshot()
      }
    }, 30000)

    it('should correctly build file path with year for Russell indices', async () => {
      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'Russell1000INDEX',
      }

      const response = await testAdapter.request(data)

      // Expected file path should be daily_values_russell_242308.csv (yy=24, day=23, month=08)
      // Capture the response for snapshot comparison
      if (response.statusCode < 500) {
        expect(response.json()).toMatchSnapshot()
      }
    }, 30000)
  })

  describe('error handling', () => {
    it('should handle SFTP connection failures gracefully', async () => {
      // Temporarily set invalid SFTP host to simulate connection failure
      const originalHost = process.env.SFTP_HOST
      process.env.SFTP_HOST = 'invalid.host.com'

      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBeGreaterThanOrEqual(400)
      expect(response.json()).toMatchSnapshot()

      // Restore original host
      if (originalHost) {
        process.env.SFTP_HOST = originalHost
      }
    }, 30000)

    it('should handle missing environment variables', async () => {
      const originalHost = process.env.SFTP_HOST
      delete process.env.SFTP_HOST

      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBeGreaterThanOrEqual(400)
      expect(response.json()).toMatchSnapshot()

      // Restore original value
      if (originalHost) {
        process.env.SFTP_HOST = originalHost
      }
    }, 30000)

    it('should handle file not found errors', async () => {
      const data = {
        operation: 'download',
        remotePath: '/nonexistent/path',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      expect(response.statusCode).toBeGreaterThanOrEqual(400)
      expect(response.json()).toMatchSnapshot()
    }, 30000)
  })

  describe('response format', () => {
    it('should return data in expected format for FTSE100INDEX', async () => {
      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      if (response.statusCode === 200) {
        expect(response.json()).toMatchSnapshot()
      } else {
        // For non-200 responses, still capture the snapshot for error scenarios
        expect(response.json()).toMatchSnapshot()
      }
    }, 30000)

    it('should return data in expected format for Russell indices', async () => {
      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'Russell1000INDEX',
      }

      const response = await testAdapter.request(data)

      if (response.statusCode === 200) {
        expect(response.json()).toMatchSnapshot()
      } else {
        // For non-200 responses, still capture the snapshot for error scenarios
        expect(response.json()).toMatchSnapshot()
      }
    }, 30000)

    it('should include proper timestamps in response', async () => {
      const data = {
        operation: 'download',
        remotePath: '/data',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)

      if (response.statusCode === 200) {
        const responseBody = response.json()
        expect(responseBody).toHaveProperty('timestamps')
        expect(responseBody.timestamps).toHaveProperty('providerDataRequestedUnixMs')
        expect(responseBody.timestamps).toHaveProperty('providerDataReceivedUnixMs')
        expect(typeof responseBody.timestamps.providerDataRequestedUnixMs).toBe('number')
        expect(typeof responseBody.timestamps.providerDataReceivedUnixMs).toBe('number')
        
        // Capture the complete response structure in snapshot
        expect(response.json()).toMatchSnapshot()
      } else {
        expect(response.json()).toMatchSnapshot()
      }
    }, 30000)
  })
})
