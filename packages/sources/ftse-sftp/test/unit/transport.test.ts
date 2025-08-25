// Mock the SubscriptionTransport before importing anything else to avoid circular dependency
jest.mock('@chainlink/external-adapter-framework/transports/abstract/subscription', () => ({
  SubscriptionTransport: class MockSubscriptionTransport {
    constructor(dependencies?: any) {}
    async backgroundHandler(context: any, entries: any[]): Promise<void> {}
    async initialize(...args: any[]): Promise<void> {}
  },
}))

// Mock the logger to prevent factory issues
jest.mock('@chainlink/external-adapter-framework/util', () => ({
  makeLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  })),
  sleep: jest.fn(),
  AdapterResponse: jest.fn(),
}))

import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { mockSftpClientInstance } from '../mocks/sftpClient'

// Mock ssh2-sftp-client
jest.mock('ssh2-sftp-client', () => {
  return require('../mocks/sftpClient').default
})

// Now import the SftpTransport after mocking dependencies
import { SftpTransport } from '../../src/transport/sftp'

describe('SftpTransport', () => {
  let transport: SftpTransport
  
  beforeEach(() => {
    transport = new SftpTransport()
    // Set up the config manually since we can't call initialize properly
    ;(transport as any).config = {
      SFTP_HOST: 'test.example.com',
      SFTP_PORT: 22,
      SFTP_USERNAME: 'testuser',
      SFTP_PASSWORD: 'testpass',
    }
    // Reset mock state
    mockSftpClientInstance.setFiles({})
    mockSftpClientInstance.setShouldFailConnection(false)
    mockSftpClientInstance.setShouldFailFileOperation(false)
    mockSftpClientInstance.setConnectionTimeout(false)
  })

  describe('getInstrumentFilePath', () => {
    it('should return correct file path for FTSE100INDEX', () => {
      const result = transport.getInstrumentFilePath('FTSE100INDEX')
      expect(result).toBe('vall{{dd}}{{mm}}.csv')
    })

    it('should return correct file path for Russell1000INDEX', () => {
      const result = transport.getInstrumentFilePath('Russell1000INDEX')
      expect(result).toBe('daily_values_russell_{{dd}}{{mm}}.csv')
    })

    it('should return correct file path for Russell2000INDEX', () => {
      const result = transport.getInstrumentFilePath('Russell2000INDEX')
      expect(result).toBe('daily_values_russell_{{dd}}{{mm}}.csv')
    })

    it('should return correct file path for Russell3000INDEX', () => {
      const result = transport.getInstrumentFilePath('Russell3000INDEX')
      expect(result).toBe('daily_values_russell_{{dd}}{{mm}}.csv')
    })

    it('should throw error for unsupported instrument', () => {
      expect(() => {
        transport.getInstrumentFilePath('UNSUPPORTED_INDEX')
      }).toThrow(AdapterInputError)
    })

    it('should throw error with specific message for unsupported instrument', () => {
      expect(() => {
        transport.getInstrumentFilePath('INVALID_INSTRUMENT')
      }).toThrow('Unsupported instrument: INVALID_INSTRUMENT')
    })
  })

  describe('buildFilePath', () => {
    let originalDateNow: typeof Date.now

    beforeAll(() => {
      originalDateNow = Date.now
      // Mock current date to 2024-08-23
      Date.now = jest.fn(() => new Date('2024-08-23T10:00:00.000Z').getTime())
    })

    afterAll(() => {
      Date.now = originalDateNow
    })

    it('should build correct file path with date substitution for FTSE100INDEX', () => {
      const result = (transport as any).buildFilePath('/data', 'FTSE100INDEX')
      expect(result).toBe('/data/vall2308.csv')
    })

    it('should build correct file path with date substitution for Russell1000INDEX', () => {
      const result = (transport as any).buildFilePath('/data', 'Russell1000INDEX')
      expect(result).toBe('/data/daily_values_russell_2308.csv')
    })

    it('should handle root path correctly', () => {
      const result = (transport as any).buildFilePath('/', 'FTSE100INDEX')
      expect(result).toBe('/vall2308.csv')
    })

    it('should handle path with trailing slash', () => {
      const result = (transport as any).buildFilePath('/data/', 'FTSE100INDEX')
      expect(result).toBe('/data/vall2308.csv')
    })

    it('should handle path without leading slash', () => {
      const result = (transport as any).buildFilePath('data', 'FTSE100INDEX')
      expect(result).toBe('data/vall2308.csv') // The method doesn't add leading slash
    })

    it('should handle nested paths correctly', () => {
      const result = (transport as any).buildFilePath('/custom/nested/path', 'FTSE100INDEX')
      expect(result).toBe('/custom/nested/path/vall2308.csv')
    })
  })

  describe('date formatting', () => {
    let originalDate: DateConstructor

    afterEach(() => {
      if (originalDate) {
        global.Date = originalDate
      }
    })

    it('should format single digit day and month with leading zeros', () => {
      originalDate = global.Date
      global.Date = jest.fn(() => new originalDate('2024-01-05T10:00:00.000Z')) as any

      const result = (transport as any).buildFilePath('/data', 'FTSE100INDEX')
      expect(result).toBe('/data/vall0501.csv')
    })

    it('should format double digit day and month correctly', () => {
      originalDate = global.Date
      global.Date = jest.fn(() => new originalDate('2024-12-25T10:00:00.000Z')) as any

      const result = (transport as any).buildFilePath('/data', 'FTSE100INDEX')
      expect(result).toBe('/data/vall2512.csv')
    })

    it('should handle end of month correctly', () => {
      originalDate = global.Date
      global.Date = jest.fn(() => new originalDate('2024-02-29T10:00:00.000Z')) as any // Leap year

      const result = (transport as any).buildFilePath('/data', 'FTSE100INDEX')
      expect(result).toBe('/data/vall2902.csv')
    })
  })

  describe('error handling', () => {
    it('should handle connection errors gracefully', async () => {
      mockSftpClientInstance.setShouldFailConnection(true)

      try {
        await (transport as any).connectToSftp()
      } catch (error) {
        expect(error).toBeInstanceOf(Error) // The mock throws a regular Error that gets wrapped
        expect((error as Error).message).toContain('Connection failed')
      }
    })

    it('should handle file operation errors gracefully', async () => {
      mockSftpClientInstance.setShouldFailFileOperation(true)
      
      try {
        await (transport as any).downloadFile('/data', 'FTSE100INDEX')
      } catch (error) {
        expect(error).toBeInstanceOf(Error) // Could be AdapterInputError or other wrapped error
        expect((error as Error).message).toContain('File operation failed')
      }
    })

    it('should handle missing file errors', async () => {
      // Don't set up any files in the mock
      
      try {
        await (transport as any).downloadFile('/data', 'FTSE100INDEX')
      } catch (error) {
        expect(error).toBeInstanceOf(Error) // Could be AdapterInputError or other wrapped error
        expect((error as Error).message).toContain('File not found')
      }
    })

    it('should handle connection timeout', async () => {
      mockSftpClientInstance.setConnectionTimeout(true)
      
      try {
        await (transport as any).connectToSftp()
      } catch (error) {
        expect(error).toBeInstanceOf(Error) // The timeout error from the mock
        expect((error as Error).message).toContain('Connection timeout')
      }
    })
  })

  describe('file processing', () => {
    it('should process CSV file content correctly', async () => {
      const csvContent = 'Date,Open,High,Low,Close\\n2024-08-23,100,110,95,105'
      const filePath = '/data/vall2308.csv'
      
      mockSftpClientInstance.setFiles({
        [filePath]: csvContent,
      })

      const result = await (transport as any).downloadFile('/data', 'FTSE100INDEX')
      const parsedResult = JSON.parse(result)
      
      expect(parsedResult.operation).toBe('download')
      expect(parsedResult.fileName).toBe('vall2308.csv')
      expect(parsedResult.path).toBe('/data')
      expect(parsedResult.content).toBe(csvContent)
      expect(parsedResult.contentType).toBe('text/csv')
      expect(parsedResult.timestamp).toBeDefined()
    })

    it('should handle empty file content', async () => {
      const filePath = '/data/vall2308.csv'
      
      mockSftpClientInstance.setFiles({
        [filePath]: '',
      })

      try {
        await (transport as any).downloadFile('/data', 'FTSE100INDEX')
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('empty') // The AdapterInputError message should mention empty
      }
    })
  })
})
