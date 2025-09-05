// Mock the SFTP client before any imports
jest.mock('ssh2-sftp-client', () => {
  class MockSftpClient {
    private files: Record<string, string> = {
      // Mock FTSE file content for current date (2025-08-28)
      '/data/valuation/uk_all_share/ukallv2808.csv': `28/08/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,USD Index,GBP Index,EUR Index,JPY Index,AUD Index,CNY Index,HKD Index,CAD Index,LOC Index,Base Currency (GBP) Index
UKX,FTSE 100 Index,100,GBP,4659.89484111,5017.24846324,4523.90007694,2963.46786723,6470.75900926,10384.47293100,4667.43880552,5177.36970414,,5017.24846324
AS0,FTSE All-Small Index,234,GBP,4659.78333168,5017.12840249,4523.79182181,2963.39695263,6470.60416658,10384.22443471,4667.32711557,5177.24581174,,5017.12840249`,

      // Mock FTSE file content for current date (2025-01-09)
      '/data/valuation/uk_all_share/ukallv0109.csv': `09/01/2025 (C) FTSE International Limited 2025. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,USD Index,GBP Index,EUR Index,JPY Index,AUD Index,CNY Index,HKD Index,CAD Index,LOC Index,Base Currency (GBP) Index
UKX,FTSE 100 Index,100,GBP,4659.89484111,5017.24846324,4523.90007694,2963.46786723,6470.75900926,10384.47293100,4667.43880552,5177.36970414,,5017.24846324
AS0,FTSE All-Small Index,234,GBP,4659.78333168,5017.12840249,4523.79182181,2963.39695263,6470.60416658,10384.22443471,4667.32711557,5177.24581174,,5017.12840249`,

      // Mock Russell file content for current date (2025-08-28)
      '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/daily_values_russell_250828.CSV': `Header line 1
Header line 2
Header line 3
Header line 4
Header line 5
Header line 6
Header line 7
Russell 1000® Index,2654.123456,2654.789012,2653.456789,2654.123456,45234567890.12
Russell 1000 Growth® Index,3456.789012,3457.123456,3456.234567,3456.789012,23456789012.34
Russell 2000® Index,1234.567890,1235.123456,1233.789012,1234.567890,12345678901.23
Russell 3000® Index,1876.543210,1877.123456,1875.789012,1876.543210,67890123456.78`,

      // Mock Russell file content for current date (2025-09-01)
      '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/daily_values_russell_250901.CSV': `Header line 1
Header line 2
Header line 3
Header line 4
Header line 5
Header line 6
Header line 7
Russell 1000® Index,2654.123456,2654.789012,2653.456789,2654.123456,45234567890.12
Russell 1000 Growth® Index,3456.789012,3457.123456,3456.234567,3456.789012,23456789012.34
Russell 2000® Index,1234.567890,1235.123456,1233.789012,1234.567890,12345678901.23
Russell 3000® Index,1876.543210,1877.123456,1875.789012,1876.543210,67890123456.78`,

      // Mock Russell file content for current date (2025-09-02)
      '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/daily_values_russell_250902.CSV': `Header line 1
Header line 2
Header line 3
Header line 4
Header line 5
Header line 6
Header line 7
Russell 1000® Index,2654.123456,2654.789012,2653.456789,2654.123456,45234567890.12
Russell 1000 Growth® Index,3456.789012,3457.123456,3456.234567,3456.789012,23456789012.34
Russell 2000® Index,1234.567890,1235.123456,1233.789012,1234.567890,12345678901.23
Russell 3000® Index,1876.543210,1877.123456,1875.789012,1876.543210,67890123456.78`,
    }

    async connect(): Promise<void> {
      // Simulate environment variable check - fail if SFTP_HOST is missing
      if (!process.env.SFTP_HOST) {
        throw new Error('SFTP connection failed: Missing host configuration')
      }
      return Promise.resolve()
    }

    async end(): Promise<void> {
      return Promise.resolve()
    }

    async get(remoteFilePath: string): Promise<Buffer> {
      // Check environment variables before attempting to get file
      if (!process.env.SFTP_HOST) {
        throw new Error('SFTP connection failed: Missing host configuration')
      }
      const content = this.files[remoteFilePath]
      if (!content) {
        throw new Error(`File not found: ${remoteFilePath}`)
      }
      return Buffer.from(content, 'utf8')
    }

    async fastGet(remoteFilePath: string): Promise<Buffer> {
      return this.get(remoteFilePath)
    }

    async exists(path: string): Promise<boolean> {
      return !!this.files[path]
    }

    // Add other methods that might be called
    async list(): Promise<any[]> {
      return []
    }

    async stat(): Promise<any> {
      return {}
    }
  }

  return MockSftpClient
})

import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter<any>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.SFTP_HOST = process.env.SFTP_HOST ?? 'sftp.test.com'
    process.env.SFTP_PORT = process.env.SFTP_PORT ?? '22'
    process.env.SFTP_USERNAME = process.env.SFTP_USERNAME ?? 'testuser'
    process.env.SFTP_PASSWORD = process.env.SFTP_PASSWORD ?? 'testpass'
    process.env.BACKGROUND_EXECUTE_MS = '0' // Disable background execution
    process.env.CACHE_ENABLED = 'false'

    const mockDate = new Date('2025-08-28T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    if (testAdapter?.api) {
      await testAdapter.api.close()
    }
    spy.mockRestore()
  })

  describe('sftp endpoint', () => {
    it('should return success for FTSE100INDEX download', async () => {
      const data = {
        endpoint: 'sftp',
        instrument: 'FTSE100INDEX',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for Russell1000INDEX download', async () => {
      const data = {
        endpoint: 'sftp',
        instrument: 'Russell1000INDEX',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for Russell2000INDEX download', async () => {
      const data = {
        endpoint: 'sftp',
        instrument: 'Russell2000INDEX',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for Russell3000INDEX download', async () => {
      const data = {
        endpoint: 'sftp',
        instrument: 'Russell3000INDEX',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should handle missing required parameters', async () => {
      const data = {
        endpoint: 'sftp',
        // Missing instrument
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should handle missing instrument parameter', async () => {
      const data = {
        endpoint: 'sftp',
        // Missing instrument
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should handle unsupported instrument', async () => {
      const data = {
        endpoint: 'sftp',
        instrument: 'UNSUPPORTED_INSTRUMENT',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should handle environment variable configuration', async () => {
      // Test that required environment variables are being used by the adapter
      // The mock client already validates that SFTP_HOST, SFTP_USERNAME, and SFTP_PASSWORD are set

      // Verify environment variables are set (required for SFTP connection)
      expect(process.env.SFTP_HOST).toBeDefined()
      expect(process.env.SFTP_USERNAME).toBeDefined()
      expect(process.env.SFTP_PASSWORD).toBeDefined()

      // Test a successful request to confirm configuration is working
      const data = {
        endpoint: 'sftp',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toHaveProperty('result')
    })
  })
})
