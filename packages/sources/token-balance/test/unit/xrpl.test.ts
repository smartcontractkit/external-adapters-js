import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes } from '../../src/endpoint/xrpl'
import { XrplTransport } from '../../src/transport/xrpl'

const log = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
}

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)

describe('XrplTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'xrpl'
  const BACKGROUND_EXECUTE_MS = 1500

  const adapterSettings = makeStub('adapterSettings', {
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    BACKGROUND_EXECUTE_MS,
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

  let transport: XrplTransport

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new XrplTransport()

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
    it('should cache response', async () => {
      const address = 'r101'

      const param = makeStub('param', {
        addresses: [{ address }],
      })
      await transport.handleRequest(context, param)

      const expectedResult = '0'
      const expectedResponse = {
        statusCode: 200,
        result: expectedResult,
        data: {
          decimals: 18,
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
          params: param,
          response: expectedResponse,
        },
      ])
      expect(responseCache.write).toBeCalledTimes(1)
    })
  })

  describe('_handleRequest', () => {
    it('should return a response', async () => {
      const address = 'r101'

      const param = makeStub('param', {
        addresses: [{ address }],
      })
      const response = await transport._handleRequest(param)

      const expectedResult = '0'
      expect(response).toEqual({
        statusCode: 200,
        result: expectedResult,
        data: {
          decimals: 18,
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })
    })
  })
})
