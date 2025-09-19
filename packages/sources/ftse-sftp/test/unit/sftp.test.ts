import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import path from 'path'
import { BaseEndpointTypes } from '../../src/endpoint/sftp'
import { SftpTransport } from '../../src/transport/sftp'

const originalEnv = { ...process.env }

const restoreEnv = () => {
  for (const key of Object.keys(process.env)) {
    if (key in originalEnv) {
      process.env[key] = originalEnv[key]
    } else {
      delete process.env[key]
    }
  }
}

const mockSftpClient = makeStub('mockSftpClient', {
  connect: jest.fn(),
  list: jest.fn(),
  get: jest.fn(),
  end: jest.fn(),
})

jest.mock(
  'ssh2-sftp-client',
  () =>
    function () {
      return mockSftpClient
    },
)

LoggerFactoryProvider.set()

describe('SftpTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'sftp'
  const SFTP_HOST = 'sftp.example.com'
  const SFTP_PORT = 22
  const SFTP_USERNAME = 'username'
  const SFTP_PASSWORD = 'password'
  const BACKGROUND_EXECUTE_MS = 1500

  const adapterSettings = makeStub('adapterSettings', {
    SFTP_HOST,
    SFTP_PORT,
    SFTP_USERNAME,
    SFTP_PASSWORD,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    BACKGROUND_EXECUTE_MS,
    MAX_COMMON_KEY_SIZE: 300,
  } as unknown as BaseEndpointTypes['Settings'])

  const context = makeStub('context', {
    adapterSettings,
  } as EndpointContext<BaseEndpointTypes>)

  const responseCache = {
    write: jest.fn(),
  }

  const dependencies = makeStub('dependencies', {
    responseCache,
    subscriptionSetFactory: {
      buildSet: jest.fn(),
    },
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  let transport: SftpTransport

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new SftpTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  describe('backgroundHandler', () => {
    it('should sleep after handleRequest', async () => {
      const t0 = Date.now()
      let t1 = 0
      transport.backgroundHandler(context, []).then(() => {
        t1 = Date.now()
      })
      await jest.runAllTimersAsync()
      expect(t1 - t0).toBe(BACKGROUND_EXECUTE_MS)
    })
  })

  describe('handleRequest', () => {
    it('should cache response', async () => {
      const filename = 'ukallv0918.csv'
      const indexCode = 'UKX'
      const indexSectorName = 'FTSE 100 Index'
      const numberOfConstituents = 100
      const indexBaseCurrency = 'GBP'
      const gbpIndex = 7654.32
      const fileContent = `Header line 1
        Header line 2

        Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,GBP Index
        ${indexCode},${indexSectorName},${numberOfConstituents},${indexBaseCurrency},${gbpIndex}`

      mockSftpClient.list.mockResolvedValue([{ name: filename }])
      mockSftpClient.get.mockResolvedValue(Buffer.from(fileContent, 'latin1'))

      const param = makeStub('param', {
        instrument: 'FTSE100INDEX',
      })
      await transport.handleRequest(param)

      const expectedResponse = {
        statusCode: 200,
        result: gbpIndex,
        data: {
          filename,
          result: {
            indexCode,
            indexSectorName,
            numberOfConstituents,
            indexBaseCurrency,
            gbpIndex,
          },
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params: param,
          response: expectedResponse,
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })
  })

  describe('_handleRequest', () => {
    describe('for FTSE100INDEX', () => {
      const directory = '/data/valuation/uk_all_share/'
      const filename = 'ukallv0918.csv'
      const indexCode = 'UKX'
      const indexSectorName = 'FTSE 100 Index'
      const numberOfConstituents = 100
      const indexBaseCurrency = 'GBP'
      const gbpIndex = 7654.32
      const fileContent = `Header line 1
        Header line 2

        Index Code,Index/Sector Name,Number of Constituents,Index Base Currency,GBP Index
        ${indexCode},${indexSectorName},${numberOfConstituents},${indexBaseCurrency},${gbpIndex}`

      it('should return result for FTSE100INDEX', async () => {
        mockSftpClient.list.mockResolvedValue([{ name: filename }])
        mockSftpClient.get.mockResolvedValue(Buffer.from(fileContent, 'latin1'))

        const param = makeStub('param', {
          instrument: 'FTSE100INDEX',
        })
        const response = await transport._handleRequest(param)

        expect(response).toEqual({
          statusCode: 200,
          result: gbpIndex,
          data: {
            filename,
            result: {
              indexCode,
              indexSectorName,
              numberOfConstituents,
              indexBaseCurrency,
              gbpIndex,
            },
          },
          timestamps: {
            providerDataRequestedUnixMs: Date.now(),
            providerDataReceivedUnixMs: Date.now(),
            providerIndicatedTimeUnixMs: undefined,
          },
        })

        expect(mockSftpClient.connect).toHaveBeenCalledWith({
          host: SFTP_HOST,
          port: SFTP_PORT,
          username: SFTP_USERNAME,
          password: SFTP_PASSWORD,
          readyTimeout: 30000,
        })
        expect(mockSftpClient.connect).toHaveBeenCalledTimes(1)
        expect(mockSftpClient.list).toHaveBeenCalledWith(directory)
        expect(mockSftpClient.list).toHaveBeenCalledTimes(1)
        expect(mockSftpClient.get).toHaveBeenCalledWith(path.join(directory, filename))
        expect(mockSftpClient.get).toHaveBeenCalledTimes(1)
      })

      it('should record received timestamp separate from requested timestamp', async () => {
        const [getFilePromise, resolveGetFile] = deferredPromise<Buffer>()

        mockSftpClient.list.mockResolvedValue([{ name: filename }])
        mockSftpClient.get.mockReturnValue(getFilePromise)

        const param = makeStub('param', {
          instrument: 'FTSE100INDEX',
        })

        const requestTimestamp = Date.now()
        const responsePromise = transport._handleRequest(param)
        jest.advanceTimersByTime(1234)
        const responseTimestamp = Date.now()
        expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

        resolveGetFile(Buffer.from(fileContent, 'latin1'))

        expect(await responsePromise).toEqual({
          statusCode: 200,
          result: gbpIndex,
          data: {
            filename,
            result: {
              indexCode,
              indexSectorName,
              numberOfConstituents,
              indexBaseCurrency,
              gbpIndex,
            },
          },
          timestamps: {
            providerDataRequestedUnixMs: requestTimestamp,
            providerDataReceivedUnixMs: responseTimestamp,
            providerIndicatedTimeUnixMs: undefined,
          },
        })
      })
    })
  })
})
