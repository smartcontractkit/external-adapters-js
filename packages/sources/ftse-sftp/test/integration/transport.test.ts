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

// Mock SFTP client
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

// Create the mock instance to use across tests
const mockSftpClient = new MockSftpClient()

jest.mock('ssh2-sftp-client', () => {
  return function() {
    return mockSftpClient
  }
})

describe('SFTP Transport Integration Tests', () => {
  let transport: SftpTransport
  let originalDateNow: typeof Date.now

  beforeAll(() => {
    originalDateNow = Date.now
  })

  afterAll(() => {
    Date.now = originalDateNow
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

    // Mock a fixed date: August 23, 2024
    const mockDate = new Date('2024-08-23T10:00:00.000Z')
    Date.now = jest.fn(() => mockDate.getTime())
    global.Date = jest.fn(() => mockDate) as any
    Object.setPrototypeOf(global.Date, Date)

    // Reset mock state
    mockSftpClient.setFiles({})
    mockSftpClient.setShouldFailConnection(false)
    mockSftpClient.setShouldFailFileOperation(false)
  })

  describe('FTSE file operations', () => {
    const ftseContent = `26/08/2024 (C) FTSE International Limited 2024. All Rights Reserved
FTSE UK All-Share Indices Valuation Service

Index Code	Index/Sector Name	Number of Constituents	Index Base Currency	USD Index	GBP Index	EUR Index	JPY Index	AUD Index	CNY Index	HKD Index	CAD Index	LOC Index	Base Currency (GBP) Index
AS0	FTSE All-Small Index	234	GBP	4659.89484111	5017.24846324	4523.90007694	2963.46786723	6470.75900926	10384.47293100	4667.43880552	5177.36970414		5017.24846324
ASX	FTSE All-Share Index	543	GBP	4659.78333168	5017.12840249	4523.79182181	2963.39695263	6470.60416658	10384.22443471	4667.32711557	5177.24581174		5017.12840249`

    it('should download and parse FTSE100INDEX file correctly', async () => {
      const expectedFileName = 'ukallv2308.csv' // day=23, month=08
      mockSftpClient.setFiles({
        [`/data/${expectedFileName}`]: ftseContent,
      })

      const result = await (transport as any).downloadFile('/data', 'FTSE100INDEX')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      // Check if the first parsed record has the expected structure
      const firstRecord = result[0]
      expect(firstRecord).toHaveProperty('indexCode', 'AS0')
      expect(firstRecord).toHaveProperty('indexSectorName', 'FTSE All-Small Index')
      expect(firstRecord).toHaveProperty('numberOfConstituents', 234)
      expect(firstRecord).toHaveProperty('indexBaseCurrency', 'GBP')
      expect(firstRecord).toHaveProperty('gbpIndex', 5017.24846324)
    })

    it('should build correct file path for FTSE100INDEX', () => {
      const filePath = (transport as any).buildFilePath('/data', 'FTSE100INDEX')
      expect(filePath).toBe('/data/ukallv2308.csv') // day=23, month=08
    })
  })

  describe('Russell file operations', () => {
    const russellContent = `Date,Index Name,Index Code,Index Value,Market Cap,Number of Companies
2024-08-23,Russell 1000 Index,RU10INTR,2654.123456,45234567890.12,1000
2024-08-23,Russell 1000 Growth Index,RU10GRTR,3456.789012,23456789012.34,500`

    it('should download and parse Russell1000INDEX file correctly', async () => {
      const expectedFileName = 'daily_values_russell_242308.csv' // yy=24, day=23, month=08
      mockSftpClient.setFiles({
        [`/data/${expectedFileName}`]: russellContent,
      })

      const result = await (transport as any).downloadFile('/data', 'Russell1000INDEX')

      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
      expect(result.length).toBeGreaterThan(0)

      // Check if the first parsed record has the expected structure
      const firstRecord = result[0]
      expect(firstRecord).toHaveProperty('date', '2024-08-23')
      expect(firstRecord).toHaveProperty('indexName', 'Russell 1000 Index')
      expect(firstRecord).toHaveProperty('indexCode', 'RU10INTR')
      expect(firstRecord).toHaveProperty('indexValue', 2654.123456)
    })

    it('should build correct file path for Russell indices with year', () => {
      const filePath1 = (transport as any).buildFilePath('/data', 'Russell1000INDEX')
      const filePath2 = (transport as any).buildFilePath('/data', 'Russell2000INDEX')
      const filePath3 = (transport as any).buildFilePath('/data', 'Russell3000INDEX')

      // All should use the same template with year=24, day=23, month=08
      const expected = '/data/daily_values_russell_242308.csv'
      expect(filePath1).toBe(expected)
      expect(filePath2).toBe(expected)
      expect(filePath3).toBe(expected)
    })
  })

  describe('Date templating edge cases', () => {
    it('should handle single digit days and months correctly', () => {
      // Mock January 5th, 2024
      const mockDate = new Date('2024-01-05T10:00:00.000Z')
      Date.now = jest.fn(() => mockDate.getTime())
      global.Date = jest.fn(() => mockDate) as any

      const ftseFilePath = (transport as any).buildFilePath('/data', 'FTSE100INDEX')
      const russellFilePath = (transport as any).buildFilePath('/data', 'Russell1000INDEX')

      expect(ftseFilePath).toBe('/data/ukallv0501.csv') // day=05, month=01
      expect(russellFilePath).toBe('/data/daily_values_russell_240501.csv') // yy=24, day=05, month=01
    })

    it('should handle year transition correctly', () => {
      // Mock January 1st, 2025
      const mockDate = new Date('2025-01-01T10:00:00.000Z')
      Date.now = jest.fn(() => mockDate.getTime())
      global.Date = jest.fn(() => mockDate) as any

      const russellFilePath = (transport as any).buildFilePath('/data', 'Russell1000INDEX')

      expect(russellFilePath).toBe('/data/daily_values_russell_250101.csv') // yy=25, day=01, month=01
    })

    it('should handle leap year dates correctly', () => {
      // Mock February 29th, 2024 (leap year)
      const mockDate = new Date('2024-02-29T10:00:00.000Z')
      Date.now = jest.fn(() => mockDate.getTime())
      global.Date = jest.fn(() => mockDate) as any

      const ftseFilePath = (transport as any).buildFilePath('/data', 'FTSE100INDEX')
      const russellFilePath = (transport as any).buildFilePath('/data', 'Russell1000INDEX')

      expect(ftseFilePath).toBe('/data/ukallv2902.csv') // day=29, month=02
      expect(russellFilePath).toBe('/data/daily_values_russell_242902.csv') // yy=24, day=29, month=02
    })
  })

  describe('Path handling', () => {
    it('should handle various path formats correctly', () => {
      const testCases = [
        { remotePath: '/data', expected: '/data/ukallv2308.csv' },
        { remotePath: '/data/', expected: '/data/ukallv2308.csv' },
        { remotePath: '/', expected: '/ukallv2308.csv' },
        { remotePath: 'data', expected: 'data/ukallv2308.csv' },
        { remotePath: '/custom/nested/path', expected: '/custom/nested/path/ukallv2308.csv' },
      ]

      testCases.forEach(({ remotePath, expected }) => {
        const result = (transport as any).buildFilePath(remotePath, 'FTSE100INDEX')
        expect(result).toBe(expected)
      })
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

      await expect((transport as any).downloadFile('/data', 'FTSE100INDEX')).rejects.toThrow()
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
        '/data/ukallv2308.csv': '', // Empty file
      })

      await expect((transport as any).downloadFile('/data', 'FTSE100INDEX')).rejects.toThrow()
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
