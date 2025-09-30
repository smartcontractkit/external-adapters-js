import {
  TestAdapter,
  makeStub,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import SftpClient from 'ssh2-sftp-client'
import { directoryListings, fileContents } from '../fixtures'

const mockSftpClient = makeStub('mockSftpClient', {
  connect: jest.fn(),
  list: jest.fn(),
  get: jest.fn(),
  end: jest.fn(),
} as unknown as SftpClient)

jest.mock(
  'ssh2-sftp-client',
  () =>
    function () {
      return mockSftpClient
    },
)

const mockSuccessfulSftpResponses = () => {
  jest.mocked(mockSftpClient.list).mockImplementation(async (directory: string) => {
    const result = directoryListings[directory]
    if (!result) {
      throw new Error(`No mock listing for directory '${directory}'`)
    }
    return result
  })

  jest.mocked(mockSftpClient.get).mockImplementation(async (filename: string) => {
    const result = fileContents[filename]
    if (!result) {
      throw new Error(`No mock file contents for filename '${filename}'`)
    }
    return Buffer.from(result, 'latin1')
  })
}

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.SFTP_HOST = 'sftp.example.com'
    process.env.SFTP_USERNAME = 'username'
    process.env.SFTP_PASSWORD = 'password'
    process.env.BACKGROUND_EXECUTE_MS = process.env.BACKGROUND_EXECUTE_MS ?? '0'
    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })

    mockSuccessfulSftpResponses()
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('sftp endpoint', () => {
    it('should return success for FTSE100INDEX', async () => {
      const data = {
        endpoint: 'sftp',
        instrument: 'FTSE100INDEX',
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })

    it('should return success for Russell1000INDEX', async () => {
      const data = {
        endpoint: 'sftp',
        instrument: 'Russell1000INDEX',
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })

    it('should return success for Russell2000INDEX', async () => {
      const data = {
        endpoint: 'sftp',
        instrument: 'Russell2000INDEX',
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })

    it('should return success for Russell3000INDEX', async () => {
      const data = {
        endpoint: 'sftp',
        instrument: 'Russell3000INDEX',
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(200)
    })

    it('should return error for unknown instrument', async () => {
      const data = {
        endpoint: 'sftp',
        instrument: 'unknown',
      }
      const response = await testAdapter.request(data)
      expect(response.json()).toMatchSnapshot()
      expect(response.statusCode).toBe(400)
    })
  })
})
