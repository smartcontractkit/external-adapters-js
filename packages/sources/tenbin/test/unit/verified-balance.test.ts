import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes } from '../../src/endpoint/verified-balance'
import { verifyAttestResponse } from '../../src/transport/util'
import { VerifiedBalanceTransport } from '../../src/transport/verified-balance'

jest.mock('../../src/transport/util', () => {
  return {
    verifyAttestResponse: jest.fn(),
  }
})

const log = jest.fn()
const debugLog = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: debugLog,
  trace: debugLog,
  msgPrefix: 'mock-logger',
}

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)

describe('VerifiedBalanceTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'verified-balance'
  const API_ENDPOINT = 'http://api.example.com'
  const API_KEY = 'test-api-key'
  const BUILD_JSON_ENDPOINT = 'http://build-json.example.com'
  const BACKGROUND_EXECUTE_MS = 10_000

  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT,
    API_KEY,
    BUILD_JSON_ENDPOINT,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    BACKGROUND_EXECUTE_MS,
    MAX_COMMON_KEY_SIZE: 300,
  } as unknown as BaseEndpointTypes['Settings'])

  const context = makeStub('context', {
    adapterSettings,
  } as EndpointContext<BaseEndpointTypes>)

  const requester = makeStub('requester', {
    request: jest.fn(),
  })

  const responseCache = {
    write: jest.fn(),
  }

  const dependencies = makeStub('dependencies', {
    requester,
    responseCache,
    subscriptionSetFactory: {
      buildSet: jest.fn(),
    },
  } as unknown as TransportDependencies<BaseEndpointTypes>)

  let transport: VerifiedBalanceTransport

  type RequestConfig = {
    baseURL: string
    method: 'GET'
    headers?: Record<string, string>
  }

  const requestConfigForAttest = {
    method: 'GET',
    baseURL: adapterSettings.API_ENDPOINT,
    headers: {
      Authorization: `Bearer ${adapterSettings.API_KEY}`,
    },
  } as const

  const requestConfigForBuildJson = {
    method: 'GET',
    baseURL: adapterSettings.BUILD_JSON_ENDPOINT,
  } as const

  const requestKeyForConfig = (requestConfig: RequestConfig) => {
    return requestConfig.baseURL
  }

  const mockAttestResponse = (balance: string | Promise<string>) => {
    requester.request.mockImplementationOnce(async () => {
      return {
        response: {
          data: {
            data: {
              agg_usd_computed_balance: await balance,
            },
          },
        },
      }
    })
  }

  const mockBuildJsonResponse = () => {
    requester.request.mockImplementationOnce(async () => {
      return {
        response: {
          data: {
            // Stub response is not used.
          },
        },
      }
    })
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new VerifiedBalanceTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toBeCalled()
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
    it('should cache a successful response', async () => {
      const balance = '1000'
      const params = makeStub('params', {})

      mockAttestResponse(balance)
      mockBuildJsonResponse()

      await transport.handleRequest(params)

      const expectedResult = balance

      const expectedResponse = {
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params,
          response: expectedResponse,
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })

    it('should cache an error response', async () => {
      const params = makeStub('params', {})
      const balance = '1000'
      const errorMessage = 'verifyAttestResponse error'

      mockAttestResponse(balance)
      mockBuildJsonResponse()

      jest.mocked(verifyAttestResponse).mockImplementationOnce(() => {
        throw new Error(errorMessage)
      })

      await transport.handleRequest(params)

      const expectedResponse = {
        statusCode: 502,
        errorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(responseCache.write).toBeCalledWith(transportName, [
        {
          params,
          response: expectedResponse,
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)

      expect(log).toBeCalledWith(expect.any(Error), errorMessage)
      log.mockClear()
    })
  })

  describe('_handleRequest', () => {
    it('should return balance response', async () => {
      const balance = '2100'
      const params = makeStub('params', {})

      mockAttestResponse(balance)
      mockBuildJsonResponse()

      const response = await transport._handleRequest(params)

      const expectedResult = balance

      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      expect(requester.request).toHaveBeenCalledWith(
        requestKeyForConfig(requestConfigForAttest),
        requestConfigForAttest,
      )
      expect(requester.request).toHaveBeenCalledWith(
        requestKeyForConfig(requestConfigForBuildJson),
        requestConfigForBuildJson,
      )
      expect(requester.request).toHaveBeenCalledTimes(2)
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const balance = '2100'
      const params = makeStub('params', {})

      const [balancePromise, resolveBalance] = deferredPromise<string>()
      mockAttestResponse(balancePromise)
      mockBuildJsonResponse()

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(params)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveBalance(balance)

      const expectedResult = balance
      expect(await responsePromise).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          result: expectedResult,
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
