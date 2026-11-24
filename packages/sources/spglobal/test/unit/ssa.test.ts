import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes } from '../../src/endpoint/ssa'
import { getToken } from '../../src/lib/auth'
import { getSecurities } from '../../src/lib/ssa'
import { SsaTransport } from '../../src/transport/ssa'

jest.mock('../../src/lib/auth', () => ({
  getToken: jest.fn(),
}))
jest.mock('../../src/lib/ssa', () => ({
  getSecurities: jest.fn(),
}))

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

describe('SsaTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'ssa'
  const API_ENDPOINT = 'http://api.example.com'
  const API_KEY = 'test-api-key'
  const AUTH_API_ENDPOINT = 'http://auth.example.com'
  const AUTH_API_KEY = 'test-auth-key'
  const TOKEN = 'test-token'
  const BACKGROUND_EXECUTE_MS = 10_000

  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT,
    API_KEY,
    AUTH_API_ENDPOINT,
    AUTH_API_KEY,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    BACKGROUND_EXECUTE_MS,
    MAX_COMMON_KEY_SIZE: 300,
  } as unknown as BaseEndpointTypes['Settings'])

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

  let transport: SsaTransport

  type Security = {
    security_id: string
    ssa: number
    time: number
  }

  const mockSecurities = (securities: Security[]) => {
    jest.mocked(getToken).mockResolvedValueOnce(TOKEN)
    jest.mocked(getSecurities).mockResolvedValueOnce(securities)
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new SsaTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    jest.useRealTimers()
    expect(log).not.toHaveBeenCalled()
  })

  describe('_handleRequest', () => {
    it('should fetch a token and return one response per security', async () => {
      const time = new Date('2025-12-19T00:00:00Z').getTime()
      mockSecurities([
        { security_id: 'aapl', ssa: 3, time },
        { security_id: 'MSFT', ssa: 5, time },
      ])

      const response = await transport._handleRequest()

      expect(getToken).toHaveBeenCalledWith(AUTH_API_ENDPOINT, AUTH_API_KEY, requester)
      expect(getSecurities).toHaveBeenCalledWith(API_ENDPOINT, TOKEN, API_KEY, requester)

      const timestamps = {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      }

      expect(response).toEqual([
        {
          params: { security_id: 'AAPL' },
          response: {
            data: { result: 3 },
            result: 3,
            timestamps: { ...timestamps, providerIndicatedTimeUnixMs: time },
          },
        },
        {
          params: { security_id: 'MSFT' },
          response: {
            data: { result: 5 },
            result: 5,
            timestamps: { ...timestamps, providerIndicatedTimeUnixMs: time },
          },
        },
      ])
    })

    it.each([0, 6, 2.5, NaN])('should return an error for invalid SSA %p', async (ssa) => {
      const time = new Date('2025-12-19T00:00:00Z').getTime()
      mockSecurities([{ security_id: 'aapl', ssa, time }])

      const response = await transport._handleRequest()

      expect(response).toEqual([
        {
          params: { security_id: 'AAPL' },
          response: {
            statusCode: 502,
            errorMessage: `Invalid SSA ${ssa} for security AAPL`,
            timestamps: {
              providerDataRequestedUnixMs: Date.now(),
              providerDataReceivedUnixMs: Date.now(),
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        },
      ])
    })

    it('should return an error for an invalid last modified timestamp', async () => {
      mockSecurities([{ security_id: 'aapl', ssa: 3, time: NaN }])

      const response = await transport._handleRequest()

      expect(response).toEqual([
        {
          params: { security_id: 'AAPL' },
          response: {
            statusCode: 502,
            errorMessage: 'Invalid last_modified_date_time NaN for security AAPL',
            timestamps: {
              providerDataRequestedUnixMs: Date.now(),
              providerDataReceivedUnixMs: Date.now(),
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        },
      ])
    })
  })

  describe('handleRequest', () => {
    it('should cache the mapped responses', async () => {
      const time = new Date('2025-12-19T00:00:00Z').getTime()
      const params = makeStub('params', { security_id: 'aapl' })
      mockSecurities([{ security_id: 'aapl', ssa: 3, time }])

      await transport.handleRequest([params])

      expect(responseCache.write).toHaveBeenCalledWith(transportName, [
        {
          params: { security_id: 'AAPL' },
          response: {
            data: { result: 3 },
            result: 3,
            timestamps: {
              providerDataRequestedUnixMs: Date.now(),
              providerDataReceivedUnixMs: Date.now(),
              providerIndicatedTimeUnixMs: time,
            },
          },
        },
      ])
      expect(responseCache.write).toHaveBeenCalledTimes(1)
    })

    it('should cache an error response for every param when the request fails', async () => {
      const params = [
        makeStub('params1', { security_id: 'aapl' }),
        makeStub('params2', { security_id: 'msft' }),
      ]
      const error = new AdapterError({ statusCode: 401, message: 'Unauthorized' })
      jest.mocked(getToken).mockRejectedValueOnce(error)

      await transport.handleRequest(params)

      const expectedResponse = {
        statusCode: 401,
        errorMessage: 'Unauthorized',
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(responseCache.write).toHaveBeenCalledWith(transportName, [
        { params: params[0], response: expectedResponse },
        { params: params[1], response: expectedResponse },
      ])
      expect(getSecurities).not.toHaveBeenCalled()
      expect(log).toHaveBeenCalledWith(error, 'Unauthorized')
      log.mockClear()
    })
  })
})
