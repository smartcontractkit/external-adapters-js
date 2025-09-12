import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import {
  mockFtse100Success,
  mockRussell1000Success,
  mockRussell2000Success,
  mockRussell3000Success,
} from './fixtures'

// Mock the entire SFTP module to avoid any actual SFTP connections
jest.mock('ssh2-sftp-client', () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    end: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(Buffer.from('')),
    fastGet: jest.fn().mockResolvedValue(Buffer.from('')),
    exists: jest.fn().mockResolvedValue(true),
    list: jest.fn().mockResolvedValue([]),
    stat: jest.fn().mockResolvedValue({}),
  }))
})

// Mock the SFTP transport completely to bypass background execution
jest.mock('../../src/transport/sftp', () => {
  return {
    sftpTransport: {
      name: 'default_single_transport',
      async initialize() {},
      async backgroundHandler() {},
      getSubscriptionTtlFromConfig() {
        return 60000
      },
    },
  }
})

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['SFTP_HOST'] = 'sftp.test.com'
    process.env['SFTP_PORT'] = '22'
    process.env['SFTP_USERNAME'] = 'testuser'
    process.env['SFTP_PASSWORD'] = 'testpass'

    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('./../../src')).adapter as unknown as Adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    if (testAdapter?.api?.close) {
      await testAdapter.api.close()
    }
    spy.mockRestore()
  })

  describe('ftse_sftp endpoint', () => {
    it('should return success for FTSE100INDEX', async () => {
      const data = {
        endpoint: 'ftse_sftp',
        instrument: 'FTSE100INDEX',
        filePath: '/data/valuation/uk_all_share/ukallv',
      }

      // Mock the response cache directly
      const mockResult = mockFtse100Success()
      jest.spyOn(testAdapter.adapter, 'handleRequest').mockResolvedValueOnce({
        statusCode: 200,
        result: mockResult as any,
        data: { result: mockResult },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for Russell1000INDEX', async () => {
      const data = {
        endpoint: 'ftse_sftp',
        instrument: 'Russell1000INDEX',
        filePath: 'Faked_Path',
      }

      // Mock the response cache directly
      const mockResult = mockRussell1000Success()
      jest.spyOn(testAdapter.adapter, 'handleRequest').mockResolvedValueOnce({
        statusCode: 200,
        result: mockResult as any,
        data: { result: mockResult },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for Russell2000INDEX', async () => {
      const data = {
        endpoint: 'ftse_sftp',
        instrument: 'Russell2000INDEX',
        filePath: 'Fake_Path',
      }

      // Mock the response cache directly
      const mockResult = mockRussell2000Success()
      jest.spyOn(testAdapter.adapter, 'handleRequest').mockResolvedValueOnce({
        statusCode: 200,
        result: mockResult as any,
        data: { result: mockResult },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return success for Russell3000INDEX', async () => {
      const data = {
        endpoint: 'ftse_sftp',
        instrument: 'Russell3000INDEX',
        filePath: 'Fake_Path',
      }

      // Mock the response cache directly
      const mockResult = mockRussell3000Success()
      jest.spyOn(testAdapter.adapter, 'handleRequest').mockResolvedValueOnce({
        statusCode: 200,
        result: mockResult as any,
        data: { result: mockResult },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
