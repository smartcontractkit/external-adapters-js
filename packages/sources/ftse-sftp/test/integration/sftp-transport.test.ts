import { ResponseCache } from '@chainlink/external-adapter-framework/cache/response'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import fs from 'fs'
import path from 'path'
import { BaseEndpointTypes } from '../../src/endpoint/sftp'

// Load actual CSV fixture files
const loadFixtureFile = (filename: string): string => {
  const fixturePath = path.join(__dirname, '..', 'fixtures', filename)
  return fs.readFileSync(fixturePath, 'latin1') // Use latin1 to match the actual file encoding
}

// Load real CSV content from fixtures
const ftseFixtureContent = loadFixtureFile('ftse100.csv')
const russellFixtureContent = loadFixtureFile('daily_russell_values.CSV')

// Mock the framework dependencies
jest.mock('@chainlink/external-adapter-framework/transports/abstract/subscription', () => ({
  SubscriptionTransport: class MockSubscriptionTransport {
    responseCache = {
      write: jest.fn(),
    }
    name = 'test'
    config = {}
    endpointName = ''
    constructor() {
      // Mock constructor
    }
    async initialize(
      dependencies: any,
      adapterSettings: any,
      endpointName: string,
      transportName: string,
    ) {
      this.config = adapterSettings
      this.endpointName = endpointName
      this.name = transportName
      this.responseCache = dependencies.responseCache
    }
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
}))

// Mock the ssh2-sftp-client
jest.mock('ssh2-sftp-client', () => {
  const mockClientMethods = {
    connect: jest.fn(),
    list: jest.fn(),
    get: jest.fn(),
    end: jest.fn(),
  }

  const MockSftpClient = jest.fn().mockImplementation(() => mockClientMethods)
  // Expose the mock methods for testing
  ;(MockSftpClient as any).mockClientMethods = mockClientMethods

  return MockSftpClient
})

// Import after mocking
import SftpClient from 'ssh2-sftp-client'
import { SftpTransport } from '../../src/transport/sftp'

describe('SftpTransport Integration Tests', () => {
  let transport: SftpTransport
  let mockResponseCache: jest.Mocked<ResponseCache<any>>
  let mockDependencies: TransportDependencies<BaseEndpointTypes>
  let mockAdapterSettings: BaseEndpointTypes['Settings']
  let mockSftpClient: any

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks()

    // Mock response cache
    mockResponseCache = {
      write: jest.fn(),
      read: jest.fn(),
    } as any

    mockDependencies = makeStub('dependencies', {
      responseCache: mockResponseCache,
    } as unknown as TransportDependencies<BaseEndpointTypes>)

    mockAdapterSettings = makeStub('adapterSettings', {
      SFTP_HOST: 'test-sftp.example.com',
      SFTP_PORT: 22,
      SFTP_USERNAME: 'testuser',
      SFTP_PASSWORD: 'testpass',
      BACKGROUND_EXECUTE_MS: 60000,
    } as unknown as BaseEndpointTypes['Settings'])

    transport = new SftpTransport()
    await transport.initialize(
      mockDependencies,
      mockAdapterSettings,
      'ftse_sftp',
      'default_single_transport',
    )

    // Use the shared mock methods from the mocked constructor
    mockSftpClient = (SftpClient as any).mockClientMethods

    // Set up default behavior
    mockSftpClient.connect.mockResolvedValue(undefined)
    mockSftpClient.list.mockResolvedValue([])
    mockSftpClient.get.mockResolvedValue(Buffer.from('', 'latin1'))
    mockSftpClient.end.mockResolvedValue(undefined)
  })

  describe('successful file download and parsing', () => {
    it('should successfully process FTSE100INDEX data', async () => {
      // Set up SFTP operations to return real fixture data
      mockSftpClient.list.mockResolvedValue([{ name: 'ukallv2025.csv', size: 1000 }])
      mockSftpClient.get.mockResolvedValue(Buffer.from(ftseFixtureContent, 'latin1'))

      await transport.handleRequest({ instrument: 'FTSE100INDEX' })

      expect(mockSftpClient.connect).toHaveBeenCalledWith({
        host: 'test-sftp.example.com',
        port: 22,
        username: 'testuser',
        password: 'testpass',
        readyTimeout: 30000,
      })
      expect(mockSftpClient.list).toHaveBeenCalledWith('/data/valuation/uk_all_share/')
      expect(mockSftpClient.get).toHaveBeenCalledWith('/data/valuation/uk_all_share/ukallv2025.csv')

      // Verify the response was written to cache with real parsed data
      expect(mockResponseCache.write).toHaveBeenCalledWith('default_single_transport', [
        {
          params: { instrument: 'FTSE100INDEX' },
          response: expect.objectContaining({
            statusCode: 200,
            data: expect.objectContaining({
              result: expect.objectContaining({
                indexCode: 'UKX',
                indexSectorName: 'FTSE 100 Index',
                numberOfConstituents: 100,
                indexBaseCurrency: 'GBP',
                gbpIndex: 9116.68749114,
              }),
            }),
          }),
        },
      ])
    })

    it('should successfully process Russell1000INDEX data', async () => {
      // Set up SFTP operations to return real fixture data
      mockSftpClient.list.mockResolvedValue([
        { name: 'daily_values_russell_250827.CSV', size: 2000 },
      ])
      mockSftpClient.get.mockResolvedValue(Buffer.from(russellFixtureContent, 'latin1'))

      await transport.handleRequest({ instrument: 'Russell1000INDEX' })

      expect(mockSftpClient.list).toHaveBeenCalledWith(
        '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/',
      )
      expect(mockSftpClient.get).toHaveBeenCalledWith(
        '/data/Returns_and_Values/Russell_US_Indexes_Daily_Index_Values_Real_Time_TXT/daily_values_russell_250827.CSV',
      )

      // Verify the response was written to cache with real parsed data
      expect(mockResponseCache.write).toHaveBeenCalledWith('default_single_transport', [
        {
          params: { instrument: 'Russell1000INDEX' },
          response: expect.objectContaining({
            statusCode: 200,
            data: expect.objectContaining({
              result: expect.objectContaining({
                indexName: 'Russell 1000® Index',
                close: 3547.4,
              }),
            }),
          }),
        },
      ])
    })

    it('should successfully process Russell2000INDEX data', async () => {
      // Set up SFTP operations to return real fixture data
      mockSftpClient.list.mockResolvedValue([
        { name: 'daily_values_russell_250827.CSV', size: 2000 },
      ])
      mockSftpClient.get.mockResolvedValue(Buffer.from(russellFixtureContent, 'latin1'))

      await transport.handleRequest({ instrument: 'Russell2000INDEX' })

      // Verify the response was written to cache with real parsed data
      expect(mockResponseCache.write).toHaveBeenCalledWith('default_single_transport', [
        {
          params: { instrument: 'Russell2000INDEX' },
          response: expect.objectContaining({
            statusCode: 200,
            data: expect.objectContaining({
              result: expect.objectContaining({
                indexName: 'Russell 2000® Index',
                close: 2373.8,
              }),
            }),
          }),
        },
      ])
    })

    it('should successfully process Russell3000INDEX data', async () => {
      // Set up SFTP operations to return real fixture data
      mockSftpClient.list.mockResolvedValue([
        { name: 'daily_values_russell_250827.CSV', size: 2000 },
      ])
      mockSftpClient.get.mockResolvedValue(Buffer.from(russellFixtureContent, 'latin1'))

      await transport.handleRequest({ instrument: 'Russell3000INDEX' })

      // Verify the response was written to cache with real parsed data
      expect(mockResponseCache.write).toHaveBeenCalledWith('default_single_transport', [
        {
          params: { instrument: 'Russell3000INDEX' },
          response: expect.objectContaining({
            statusCode: 200,
            data: expect.objectContaining({
              result: expect.objectContaining({
                indexName: 'Russell 3000® Index',
                close: 3690.93,
              }),
            }),
          }),
        },
      ])
    })
  })

  describe('error scenarios', () => {
    it('should handle SFTP connection failure', async () => {
      mockSftpClient.connect.mockRejectedValue(new Error('Connection timeout'))

      await transport.handleRequest({ instrument: 'FTSE100INDEX' })

      expect(mockResponseCache.write).toHaveBeenCalledWith('default_single_transport', [
        {
          params: { instrument: 'FTSE100INDEX' },
          response: expect.objectContaining({
            statusCode: 502,
            errorMessage: 'Failed to connect to SFTP server: Connection timeout',
          }),
        },
      ])
    })

    it('should handle no matching files found', async () => {
      mockSftpClient.list.mockResolvedValue([{ name: 'wrongfile.txt', size: 100 }])

      await transport.handleRequest({ instrument: 'FTSE100INDEX' })

      expect(mockResponseCache.write).toHaveBeenCalledWith('default_single_transport', [
        {
          params: { instrument: 'FTSE100INDEX' },
          response: expect.objectContaining({
            statusCode: 502,
            errorMessage:
              'No files matching pattern /^ukallv\\d{4}\\.csv$/ found in directory: /data/valuation/uk_all_share/',
          }),
        },
      ])
    })

    it('should handle multiple matching files found', async () => {
      mockSftpClient.list.mockResolvedValue([
        { name: 'ukallv2025.csv', size: 1000 },
        { name: 'ukallv2024.csv', size: 1000 },
      ])

      await transport.handleRequest({ instrument: 'FTSE100INDEX' })

      expect(mockResponseCache.write).toHaveBeenCalledWith('default_single_transport', [
        {
          params: { instrument: 'FTSE100INDEX' },
          response: expect.objectContaining({
            statusCode: 502,
            errorMessage:
              'Multiple files matching pattern /^ukallv\\d{4}\\.csv$/ found in directory: /data/valuation/uk_all_share/.',
          }),
        },
      ])
    })

    it('should handle file download failure', async () => {
      mockSftpClient.list.mockResolvedValue([{ name: 'ukallv2025.csv', size: 1000 }])
      mockSftpClient.get.mockRejectedValue(new Error('File not accessible'))

      await transport.handleRequest({ instrument: 'FTSE100INDEX' })

      expect(mockResponseCache.write).toHaveBeenCalledWith('default_single_transport', [
        {
          params: { instrument: 'FTSE100INDEX' },
          response: expect.objectContaining({
            statusCode: 502,
            errorMessage: 'File not accessible',
          }),
        },
      ])
    })

    it('should handle unsupported instrument', async () => {
      mockSftpClient.list.mockResolvedValue([{ name: 'somefile.csv', size: 1000 }])
      mockSftpClient.get.mockResolvedValue(Buffer.from('some content', 'latin1'))

      await transport.handleRequest({ instrument: 'UNSUPPORTED_INSTRUMENT' as any })

      expect(mockResponseCache.write).toHaveBeenCalledWith('default_single_transport', [
        {
          params: { instrument: 'UNSUPPORTED_INSTRUMENT' },
          response: expect.objectContaining({
            statusCode: 502,
            errorMessage: 'No parser found for instrument: UNSUPPORTED_INSTRUMENT',
          }),
        },
      ])
    })
  })

  describe('background handler', () => {
    it('should process multiple requests in background handler', async () => {
      // Set up SFTP operations for multiple instruments
      mockSftpClient.list
        .mockResolvedValueOnce([{ name: 'ukallv2025.csv', size: 1000 }])
        .mockResolvedValueOnce([{ name: 'daily_values_russell_250827.CSV', size: 2000 }])
      mockSftpClient.get
        .mockResolvedValueOnce(Buffer.from(ftseFixtureContent, 'latin1'))
        .mockResolvedValueOnce(Buffer.from(russellFixtureContent, 'latin1'))

      const mockContext = {
        adapterSettings: mockAdapterSettings,
      }

      const entries = [{ instrument: 'FTSE100INDEX' }, { instrument: 'Russell1000INDEX' }]

      await transport.backgroundHandler(mockContext as any, entries)

      // Verify both requests were processed with real parsing
      expect(mockResponseCache.write).toHaveBeenCalledTimes(2)
      expect(mockResponseCache.write).toHaveBeenNthCalledWith(1, 'default_single_transport', [
        {
          params: { instrument: 'FTSE100INDEX' },
          response: expect.objectContaining({
            statusCode: 200,
            data: expect.objectContaining({
              result: expect.objectContaining({
                indexCode: 'UKX',
                gbpIndex: 9116.68749114,
              }),
            }),
          }),
        },
      ])
      expect(mockResponseCache.write).toHaveBeenNthCalledWith(2, 'default_single_transport', [
        {
          params: { instrument: 'Russell1000INDEX' },
          response: expect.objectContaining({
            statusCode: 200,
            data: expect.objectContaining({
              result: expect.objectContaining({
                indexName: 'Russell 1000® Index',
                close: 3547.4,
              }),
            }),
          }),
        },
      ])
    })

    it('should handle errors gracefully in background handler', async () => {
      mockSftpClient.connect.mockRejectedValue(new Error('Connection failed'))

      const mockContext = {
        adapterSettings: mockAdapterSettings,
      }

      const entries = [{ instrument: 'FTSE100INDEX' }]

      await transport.backgroundHandler(mockContext as any, entries)

      // Verify error was handled and cached
      expect(mockResponseCache.write).toHaveBeenCalledWith('default_single_transport', [
        {
          params: { instrument: 'FTSE100INDEX' },
          response: expect.objectContaining({
            statusCode: 502,
            errorMessage: 'Failed to connect to SFTP server: Connection failed',
          }),
        },
      ])
    })
  })

  describe('subscription configuration', () => {
    it('should return correct subscription TTL from config', () => {
      const ttl = transport.getSubscriptionTtlFromConfig(mockAdapterSettings)
      expect(ttl).toBe(60000)
    })

    it('should return default TTL when BACKGROUND_EXECUTE_MS is not set', () => {
      const settingsWithoutExecuteMs = makeStub('settingsWithoutExecuteMs', {
        BACKGROUND_EXECUTE_MS: 0, // This will trigger the || 60000 fallback
      } as unknown as BaseEndpointTypes['Settings'])

      const ttl = transport.getSubscriptionTtlFromConfig(settingsWithoutExecuteMs)
      expect(ttl).toBe(60000)
    })
  })
})
