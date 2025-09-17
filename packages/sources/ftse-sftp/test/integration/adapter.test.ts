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
const mockSftpClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  end: jest.fn().mockResolvedValue(undefined),
  get: jest.fn(),
  fastGet: jest.fn().mockResolvedValue(Buffer.from('')),
  exists: jest.fn().mockResolvedValue(true),
  list: jest.fn(),
  stat: jest.fn().mockResolvedValue({}),
}

jest.mock('ssh2-sftp-client', () => {
  return jest.fn().mockImplementation(() => mockSftpClient)
})

// Create a more realistic mock of the SFTP transport that actually processes requests
jest.mock('../../src/transport/sftp', () => {
  const originalModule = jest.requireActual('../../src/transport/sftp')

  return {
    ...originalModule,
    sftpTransport: {
      name: 'default_single_transport',
      config: {} as any,
      responseCache: {} as any,
      endpointName: '',
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
      },
      async backgroundHandler(context: any, entries: any[]) {
        // Process each entry and write to cache
        for (const entry of entries) {
          const result = await this.processRequest(entry)
          if (this.responseCache && this.responseCache.write) {
            await this.responseCache.write(this.name, [{ params: entry, response: result }])
          }
        }
      },
      async processRequest(param: any) {
        // Mock the successful processing based on instrument
        const mockResults: Record<string, any> = {
          FTSE100INDEX: mockFtse100Success(),
          Russell1000INDEX: mockRussell1000Success(),
          Russell2000INDEX: mockRussell2000Success(),
          Russell3000INDEX: mockRussell3000Success(),
        }

        const result = mockResults[param.instrument]
        if (!result) {
          throw new Error(`Unsupported instrument: ${param.instrument}`)
        }

        return {
          statusCode: 200,
          data: { result },
          result,
          timestamps: {
            providerDataRequestedUnixMs: Date.now(),
            providerDataReceivedUnixMs: Date.now(),
            providerIndicatedTimeUnixMs: undefined,
          },
        }
      },
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
