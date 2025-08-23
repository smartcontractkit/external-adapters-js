import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import { mockSftpClientInstance } from '../mocks/sftpClient'
import {
  ftse100CsvContent,
  getCurrentDateFormatted,
  getExpectedFileName,
  russell1000CsvContent,
  russell2000CsvContent,
  russell3000CsvContent,
} from './fixtures'

// Mock ssh2-sftp-client before importing the adapter
jest.mock('ssh2-sftp-client', () => {
  return require('../mocks/sftpClient').default
})

describe('SFTP Generic Adapter', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter<any>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    // Set required environment variables
    process.env.SFTP_HOST = 'localhost'
    process.env.SFTP_PORT = '2222'
    process.env.SFTP_USERNAME = 'testuser'
    process.env.SFTP_PASSWORD = 'testpass'
    process.env.BACKGROUND_EXECUTE_MS = '0'

    const mockDate = new Date('2024-08-23T10:00:00.000Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = (await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<any>,
    })) as any
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    spy.mockRestore()
  })

  beforeEach(() => {
    // Reset mock state before each test
    mockSftpClientInstance.setFiles({})
    mockSftpClientInstance.setShouldFailConnection(false)
    mockSftpClientInstance.setShouldFailFileOperation(false)
    mockSftpClientInstance.setConnectionTimeout(false)
  })

  describe('sftp endpoint', () => {
    it('should fail with missing required parameters', async () => {
      const data = {
        endpoint: 'sftp',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should fail with unsupported operation', async () => {
      const data = {
        endpoint: 'sftp',
        operation: 'upload',
        remotePath: '/data',
        instrument: 'FTSE100INDEX',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should fail with unsupported instrument', async () => {
      const data = {
        endpoint: 'sftp',
        operation: 'download',
        remotePath: '/data',
        instrument: 'UNSUPPORTED_INDEX',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })

    it('should successfully download FTSE100INDEX file', async () => {
      const { day, month } = getCurrentDateFormatted()
      const fileName = getExpectedFileName('FTSE100INDEX', day, month)
      const filePath = `/data/${fileName}`

      // Set up mock files
      mockSftpClientInstance.setFiles({
        [filePath]: ftse100CsvContent,
      })

      const data = {
        endpoint: 'sftp',
        operation: 'download',
        remotePath: '/data',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should successfully download Russell1000INDEX file', async () => {
      const { day, month } = getCurrentDateFormatted()
      const fileName = getExpectedFileName('Russell1000INDEX', day, month)
      const filePath = `/data/${fileName}`

      // Set up mock files
      mockSftpClientInstance.setFiles({
        [filePath]: russell1000CsvContent,
      })

      const data = {
        endpoint: 'sftp',
        operation: 'download',
        remotePath: '/data',
        instrument: 'Russell1000INDEX',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should successfully download Russell2000INDEX file', async () => {
      const { day, month } = getCurrentDateFormatted()
      const fileName = getExpectedFileName('Russell2000INDEX', day, month)
      const filePath = `/data/${fileName}`

      // Set up mock files
      mockSftpClientInstance.setFiles({
        [filePath]: russell2000CsvContent,
      })

      const data = {
        endpoint: 'sftp',
        operation: 'download',
        remotePath: '/data',
        instrument: 'Russell2000INDEX',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should successfully download Russell3000INDEX file', async () => {
      const { day, month } = getCurrentDateFormatted()
      const fileName = getExpectedFileName('Russell3000INDEX', day, month)
      const filePath = `/data/${fileName}`

      // Set up mock files
      mockSftpClientInstance.setFiles({
        [filePath]: russell3000CsvContent,
      })

      const data = {
        endpoint: 'sftp',
        operation: 'download',
        remotePath: '/data',
        instrument: 'Russell3000INDEX',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should fail when file is not found', async () => {
      // Don't set up any files in the mock, and ensure mock will throw file not found error
      mockSftpClientInstance.setFiles({})

      const data = {
        endpoint: 'sftp',
        operation: 'download',
        remotePath: '/data-notfound', // Use unique path to avoid cache hits
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(500)
      expect(response.json()).toMatchSnapshot()
    })

    it('should fail when SFTP connection fails', async () => {
      mockSftpClientInstance.setShouldFailConnection(true)

      const data = {
        endpoint: 'sftp',
        operation: 'download',
        remotePath: '/data-connfail', // Use unique path to avoid cache hits
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(500)
      expect(response.json()).toMatchSnapshot()
    })

    it('should fail when SFTP connection times out', async () => {
      mockSftpClientInstance.setConnectionTimeout(true)

      const data = {
        endpoint: 'sftp',
        operation: 'download',
        remotePath: '/data-timeout', // Use unique path to avoid cache hits
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(500)
      expect(response.json()).toMatchSnapshot()
    })

    it('should fail when file operation fails', async () => {
      mockSftpClientInstance.setShouldFailFileOperation(true)

      const data = {
        endpoint: 'sftp',
        operation: 'download',
        remotePath: '/data-opfail', // Use unique path to avoid cache hits
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(500)
      expect(response.json()).toMatchSnapshot()
    })

    it('should handle different remote paths correctly', async () => {
      const { day, month } = getCurrentDateFormatted()
      const fileName = getExpectedFileName('FTSE100INDEX', day, month)
      const filePath = `/custom/path/${fileName}`

      // Set up mock files
      mockSftpClientInstance.setFiles({
        [filePath]: ftse100CsvContent,
      })

      const data = {
        endpoint: 'sftp',
        operation: 'download',
        remotePath: '/custom/path',
        instrument: 'FTSE100INDEX',
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
