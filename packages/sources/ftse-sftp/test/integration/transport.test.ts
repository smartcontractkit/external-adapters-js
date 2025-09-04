import { SftpTransport } from '../../src/transport/sftp'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

// Mock the framework dependencies
jest.mock('@chainlink/external-adapter-framework/transports/abstract/subscription', () => ({
  SubscriptionTransport: class MockSubscriptionTransport {
    responseCache = {
      write: jest.fn(),
    }
    name = 'test'
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    constructor() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async initialize() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    async backgroundHandler() {}
  },
}))

jest.mock('@chainlink/external-adapter-framework/util', () => ({
  makeLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  })),
  sleep: jest.fn(),
  AdapterResponse: jest.fn(),
  hasRepeatedValues: jest.fn((arr: unknown[]) => new Set(arr).size !== arr.length),
}))

jest.mock('ssh2-sftp-client', () => {
  // Mock SFTP client class that will be returned by the constructor
  class MockSftpClient {
    private isConnected = false
    private files: Record<string, string> = {}
    private shouldFailConnection = false
    private shouldFailFileOperation = false

    setFiles(files: Record<string, string>) {
      this.files = files
    }

    setShouldFailConnection(fail: boolean) {
      this.shouldFailConnection = fail
    }

    setShouldFailFileOperation(fail: boolean) {
      this.shouldFailFileOperation = fail
    }

    async connect(_config: any): Promise<void> {
      if (this.shouldFailConnection) {
        throw new Error('SFTP connection failed')
      }
      this.isConnected = true
    }

    async end(): Promise<void> {
      this.isConnected = false
    }

    async get(remotePath: string): Promise<Buffer> {
      if (!this.isConnected) {
        throw new Error('Not connected to SFTP')
      }

      if (this.shouldFailFileOperation) {
        throw new Error('File operation failed')
      }

      const content = this.files[remotePath]
      if (content === undefined) {
        throw new Error(`File not found: ${remotePath}`)
      }

      return Buffer.from(content, 'utf8')
    }
  }

  // Global instance that can be accessed by tests
  ;(global as any).mockSftpClient = new MockSftpClient()

  return function () {
    return (global as any).mockSftpClient
  }
})

describe('SFTP Transport Integration Tests', () => {
  let transport: SftpTransport
  let mockSftpClient: any

  beforeAll(() => {
    mockSftpClient = (global as any).mockSftpClient

    // Mock the system time to August 23, 2024 at 10:00 AM UTC
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-08-23T10:00:00.000Z'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    transport = new SftpTransport()
    // Mock the config
    ;(transport as any).config = {
      SFTP_HOST: 'test.example.com',
      SFTP_PORT: 22,
      SFTP_USERNAME: 'testuser',
      SFTP_PASSWORD: 'testpass',
    }

    // Reset mock state first
    mockSftpClient.setFiles({})
    mockSftpClient.setShouldFailConnection(false)
    mockSftpClient.setShouldFailFileOperation(false)
  })

  describe('FTSE file operations', () => {
    const ftseContent = `26/08/2024 (C) FTSE International Limited 2024. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,USD Index,GBP Index,EUR Index,JPY Index,AUD Index,CNY Index,HKD Index,CAD Index,LOC Index,Base Currency (GBP) Index
UKX,FTSE 100 Index,100,GBP,4659.89484111,5017.24846324,4523.90007694,2963.46786723,6470.75900926,10384.47293100,4667.43880552,5177.36970414,,5017.24846324
AS0,FTSE All-Small Index,234,GBP,4659.78333168,5017.12840249,4523.79182181,2963.39695263,6470.60416658,10384.22443471,4667.32711557,5177.24581174,,5017.12840249`

    it('should download and parse FTSE100INDEX file correctly', async () => {
      const expectedFileName = 'ukallv2208.csv' // day=22 (going back one day from 23), month=08
      mockSftpClient.setFiles({
        [`/data/${expectedFileName}`]: ftseContent,
      })

      // Make sure SFTP is marked as connected for this test
      await (transport as any).connectToSftp()

      const result = await (transport as any).downloadFile('/data', 'FTSE100INDEX')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      // Check if the first parsed record has the expected structure
      const firstRecord = result[0]
      expect(firstRecord).toHaveProperty('indexCode', 'UKX')
      expect(firstRecord).toHaveProperty('indexSectorName', 'FTSE 100 Index')
      expect(firstRecord).toHaveProperty('numberOfConstituents', 100)
      expect(firstRecord).toHaveProperty('indexBaseCurrency', 'GBP')
      expect(firstRecord).toHaveProperty('gbpIndex', 5017.24846324)
    })

    it('should build correct file path for FTSE100INDEX', () => {
      // Mock the specific date for this test
      const testDate = new Date('2024-08-23T10:00:00.000Z')
      jest.setSystemTime(testDate)

      const filePath = (transport as any).buildFilePath('/data', 'FTSE100INDEX')
      expect(filePath).toBe('/data/ukallv2208.csv') // day=22 (going back one day from 23), month=08
    })
  })

  describe('Russell file operations', () => {
    const russellContent = `Header line 1
Header line 2
Header line 3
Header line 4
Header line 5
Header line 6
Russell 1000® Index,2654.123456,2654.789012,2653.456789,2654.123456,45234567890.12
Russell 1000 Growth® Index,3456.789012,3457.123456,3456.234567,3456.789012,23456789012.34
Russell 2000® Index,1234.567890,1235.123456,1233.789012,1234.567890,12345678901.23`

    it('should download and parse Russell1000INDEX file correctly', async () => {
      const expectedFileName = 'daily_values_russell_240822.CSV' // yy=24, mm=08, dd=22 (going back one day from 23)
      mockSftpClient.setFiles({
        [`/data/${expectedFileName}`]: russellContent,
      })

      // Make sure SFTP is marked as connected for this test
      await (transport as any).connectToSftp()

      const result = await (transport as any).downloadFile('/data', 'Russell1000INDEX')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      // Check if the first parsed record has the expected structure
      const firstRecord = result[0]
      expect(firstRecord).toHaveProperty('indexName', 'Russell 1000® Index')
      expect(firstRecord).toHaveProperty('close', 2654.123456)
    })

    it('should build correct file path for Russell indices with year', () => {
      // Mock the specific date for this test
      const testDate = new Date('2024-08-23T10:00:00.000Z')
      jest.setSystemTime(testDate)

      const filePath1 = (transport as any).buildFilePath('/data', 'Russell1000INDEX')
      const filePath2 = (transport as any).buildFilePath('/data', 'Russell2000INDEX')
      const filePath3 = (transport as any).buildFilePath('/data', 'Russell3000INDEX')

      // Template is {{yy}}{{mm}}{{dd}} = year, month, day
      const expected = '/data/daily_values_russell_240822.CSV' // day=22 (going back one day from 23)
      expect(filePath1).toBe(expected)
      expect(filePath2).toBe(expected)
      expect(filePath3).toBe(expected)
    })
  })

  describe('Date templating edge cases', () => {
    it('should handle single digit days and months correctly', () => {
      // Mock January 5th, 2024
      const mockDate = new Date('2024-01-05T10:00:00.000Z')
      jest.setSystemTime(mockDate)

      const ftseFilePath = (transport as any).buildFilePath('/data', 'FTSE100INDEX')
      const russellFilePath = (transport as any).buildFilePath('/data', 'Russell1000INDEX')

      expect(ftseFilePath).toBe('/data/ukallv0401.csv') // day=04 (going back one day), month=01
      expect(russellFilePath).toBe('/data/daily_values_russell_240104.CSV') // yy=24, month=01, day=04
    })

    it('should handle year transition correctly', () => {
      // Mock January 2nd, 2025 (so going back one day gives Jan 1st)
      const mockDate = new Date('2025-01-02T10:00:00.000Z')
      jest.setSystemTime(mockDate)

      const russellFilePath = (transport as any).buildFilePath('/data', 'Russell1000INDEX')

      expect(russellFilePath).toBe('/data/daily_values_russell_250101.CSV') // yy=25, month=01, day=01
    })

    it('should handle leap year dates correctly', () => {
      // Mock March 1st, 2024 (so going back one day gives Feb 29th)
      const mockDate = new Date('2024-03-01T10:00:00.000Z')
      jest.setSystemTime(mockDate)

      const ftseFilePath = (transport as any).buildFilePath('/data', 'FTSE100INDEX')
      const russellFilePath = (transport as any).buildFilePath('/data', 'Russell1000INDEX')

      expect(ftseFilePath).toBe('/data/ukallv2902.csv') // day=29, month=02
      expect(russellFilePath).toBe('/data/daily_values_russell_240229.CSV') // yy=24, month=02, day=29
    })
  })

  describe('Path handling', () => {
    it('should handle various path formats correctly', () => {
      // Set a consistent date for this test
      const testDate = new Date('2024-12-28T10:00:00.000Z') // December 28, so it goes back to Dec 27
      jest.setSystemTime(testDate)

      const testCases = [
        { remotePath: '/data', expected: '/data/ukallv2712.csv' },
        { remotePath: '/data/', expected: '/data/ukallv2712.csv' },
        { remotePath: '/', expected: '/ukallv2712.csv' },
        { remotePath: 'data', expected: 'data/ukallv2712.csv' },
        { remotePath: '/custom/nested/path', expected: '/custom/nested/path/ukallv2712.csv' },
      ]

      testCases.forEach(({ remotePath, expected }) => {
        const result = (transport as any).buildFilePath(remotePath, 'FTSE100INDEX')
        expect(result).toBe(expected)
      })
    })
  })

  describe('Date fallback functionality', () => {
    const ftseContent = `26/08/2024 (C) FTSE International Limited 2024. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,USD Index,GBP Index,EUR Index,JPY Index,AUD Index,CNY Index,HKD Index,CAD Index,LOC Index,Base Currency (GBP) Index
UKX,FTSE 100 Index,100,GBP,4659.89484111,5017.24846324,4523.90007694,2963.46786723,6470.75900926,10384.47293100,4667.43880552,5177.36970414,,5017.24846324`

    beforeEach(() => {
      // Mock a consistent date for all fallback tests: September 2, 2025, 10:00 AM GMT
      // This ensures files would be looked for on Sept 2, 1, 31 Aug, 30 Aug respectively
      const mockDate = new Date('2025-09-02T10:00:00.000Z')
      jest.setSystemTime(mockDate)
    })

    it('should fallback to previous day when current file is not available', async () => {
      // With mocked date Sept 2, 2025:
      // Day 0: ukallv0209.csv (Sept 2)
      // Day 1: ukallv0109.csv (Sept 1) - this is what we'll provide
      const fallbackFileName = 'ukallv0109.csv' // 1 day back
      mockSftpClient.setFiles({
        [`/data/${fallbackFileName}`]: ftseContent,
      })

      await (transport as any).connectToSftp()
      const result = await (transport as any).downloadFile('/data', 'FTSE100INDEX')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('indexCode', 'UKX')
    })

    it('should fallback up to 3 days when recent files are not available', async () => {
      // With mocked date Sept 2, 2025:
      // Day 0: ukallv0209.csv (Sept 2)
      // Day 1: ukallv0109.csv (Sept 1)
      // Day 2: ukallv3108.csv (Aug 31)
      // Day 3: ukallv3008.csv (Aug 30) - this is what we'll provide
      const fallbackFileName = 'ukallv3008.csv' // 3 days back
      mockSftpClient.setFiles({
        [`/data/${fallbackFileName}`]: ftseContent,
      })

      await (transport as any).connectToSftp()
      const result = await (transport as any).downloadFile('/data', 'FTSE100INDEX')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('indexCode', 'UKX')
    })

    it('should fail after trying all fallback days (0-3 days back)', async () => {
      // Don't provide any files
      mockSftpClient.setFiles({})

      await expect((transport as any).downloadFile('/data', 'FTSE100INDEX')).rejects.toThrow(
        'Failed to download file after trying 5 days back',
      )
    })

    it('should work with Russell indices fallback', async () => {
      const russellContent = `Header line 1
Header line 2
Header line 3
Header line 4
Header line 5
Header line 6
Russell 1000® Index,2654.123456,2654.789012,2653.456789,2654.123456,45234567890.12`

      // With mocked date Sept 2, 2025:
      // Day 0: daily_values_russell_250902.CSV (Sept 2)
      // Day 1: daily_values_russell_250901.CSV (Sept 1)
      // Day 2: daily_values_russell_250831.CSV (Aug 31) - this is what we'll provide
      const fallbackFileName = 'daily_values_russell_250831.CSV' // 2 days back
      mockSftpClient.setFiles({
        [`/data/${fallbackFileName}`]: russellContent,
      })

      await (transport as any).connectToSftp()
      const result = await (transport as any).downloadFile('/data', 'Russell1000INDEX')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toHaveProperty('indexName', 'Russell 1000® Index')
    })
  })

  describe('Error handling', () => {
    it('should throw error for unsupported instruments', () => {
      expect(() => {
        transport.getInstrumentFilePath('UNSUPPORTED_INSTRUMENT')
      }).toThrow(AdapterInputError)

      let error: Error | undefined
      try {
        transport.getInstrumentFilePath('UNSUPPORTED_INSTRUMENT')
      } catch (e) {
        error = e as Error
      }

      expect(error).toBeDefined()
      expect({
        name: error?.name,
        message: error?.message,
      }).toMatchSnapshot()
    })

    it('should handle SFTP connection failures', async () => {
      mockSftpClient.setShouldFailConnection(true)

      await expect((transport as any).connectToSftp()).rejects.toThrow()
    })

    it('should handle file not found errors', async () => {
      mockSftpClient.setFiles({}) // No files available

      await expect((transport as any).downloadFile('/data', 'FTSE100INDEX')).rejects.toThrow(
        'Failed to download file after trying 5 days back',
      )
    })

    it('should handle file operation failures', async () => {
      mockSftpClient.setFiles({
        '/data/ukallv2308.csv': 'some content',
      })
      mockSftpClient.setShouldFailFileOperation(true)

      await expect((transport as any).downloadFile('/data', 'FTSE100INDEX')).rejects.toThrow()
    })

    it('should handle empty file content', async () => {
      mockSftpClient.setFiles({
        '/data/ukallv2208.csv': '', // Empty file
        '/data/ukallv2108.csv': '', // Empty fallback files too
        '/data/ukallv2008.csv': '',
        '/data/ukallv1908.csv': '',
      })

      await expect((transport as any).downloadFile('/data', 'FTSE100INDEX')).rejects.toThrow(
        'Failed to download file after trying 5 days back',
      )
    })
  })

  describe('SFTP connection management', () => {
    it('should reuse existing connection', async () => {
      // First connection
      await (transport as any).connectToSftp()
      expect((transport as any).isConnected).toBe(true)

      // Second call should reuse connection
      await (transport as any).connectToSftp()
      expect((transport as any).isConnected).toBe(true)
    })

    it('should disconnect properly on cleanup', async () => {
      await (transport as any).connectToSftp()
      expect((transport as any).isConnected).toBe(true)

      await transport.cleanup()
      expect((transport as any).isConnected).toBe(false)
    })
  })

  describe('Configuration validation', () => {
    it('should validate required SFTP_HOST', async () => {
      ;(transport as any).config.SFTP_HOST = undefined

      await expect((transport as any).connectToSftp()).rejects.toThrow(
        'Environment variable SFTP_HOST is missing',
      )
    })

    it('should validate required SFTP_PASSWORD', async () => {
      ;(transport as any).config.SFTP_PASSWORD = undefined

      await expect((transport as any).connectToSftp()).rejects.toThrow(
        'SFTP_PASSWORD must be provided',
      )
    })
  })
})
