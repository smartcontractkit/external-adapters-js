import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes } from '../../src/endpoint/stellar'
import { StellarTransport } from '../../src/transport/stellar'

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

const log = jest.fn()
const logger = {
  fatal: log,
  error: log,
  warn: log,
  info: log,
  debug: log,
  trace: log,
  msgPrefix: 'mock-logger',
}

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)

describe('StellarTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'stellar'
  const STELLAR_RPC_URL = 'https://stellerl.rpc.url'
  const BACKGROUND_EXECUTE_MS = 1500

  const adapterSettings = makeStub('adapterSettings', {
    STELLAR_RPC_URL,
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

  let transport: StellarTransport

  const mockGetLedgerEntries = (delay: undefined | Promise<void> = undefined) => {
    requester.request.mockImplementationOnce(async () => {
      await delay
      return {
        response: {
          data: {
            jsonrpc: '2.0',
            id: 1,
            result: {
              entries: [
                {
                  key: 'AAAAAAAAAABziXLsMRsuIgKWk6j+9AY1VMp7qz2sjkLXEubgEpdYCg==',
                  xdr: 'AAAAAAAAAABziXLsMRsuIgKWk6j+9AY1VMp7qz2sjkLXEubgEpdYCgAAOkPp9KUnA2IfqAAAAAsAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAAOVF1kAAAAAaS2dTA==',
                  lastModifiedLedgerSeq: 60102494,
                  extXdr: 'AAAAAA==',
                },
                {
                  key: 'AAAAAAAAAAB5JNQfUAo8pLWciV1i2cg3UgGnOrdpJid2ry0YeEiNZQ==',
                  xdr: 'AAAAAAAAAAB5JNQfUAo8pLWciV1i2cg3UgGnOrdpJid2ry0YeEiNZQAAAAAX14OcAgdV6gAACjgAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAAOVRdcAAAAAaS6kuw==',
                  lastModifiedLedgerSeq: 60114391,
                  extXdr: 'AAAAAA==',
                },
              ],
            },
          },
        },
      }
    })
  }

  const address1 = 'GBZYS4XMGENS4IQCS2J2R7XUAY2VJST3VM62ZDSC24JONYASS5MAVROB'
  const address2 = 'GB4SJVA7KAFDZJFVTSEV2YWZZA3VEANHHK3WSJRHO2XS2GDYJCGWKDB5'
  const balance1 = 64063362344231
  const balance2 = 399999900

  const expectedResult = [
    {
      address: address1,
      balance: balance1.toString(),
    },
    {
      address: address2,
      balance: balance2.toString(),
    },
  ]

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new StellarTransport()

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
      mockGetLedgerEntries()

      const param = makeStub('param', {
        addresses: [{ address: address1 }, { address: address2 }],
      })
      await transport.handleRequest(context, param)

      const expectedResponse = {
        statusCode: 200,
        result: null,
        data: {
          decimals: 7,
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

      expect(log).toBeCalledWith(expect.stringContaining('Generated HTTP request queue key:'))
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })
  })

  describe('_handleRequest', () => {
    it('should return balances', async () => {
      mockGetLedgerEntries()

      const param = makeStub('param', {
        addresses: [{ address: address1 }, { address: address2 }],
      })
      const response = await transport._handleRequest(param)

      expect(response).toEqual({
        statusCode: 200,
        result: null,
        data: {
          decimals: 7,
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      expect(log).toHaveBeenCalledWith(expect.stringContaining('Generated HTTP request queue key:'))
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const [delay, resolveDelay] = deferredPromise<void>()
      mockGetLedgerEntries(delay)

      const param = makeStub('param', {
        addresses: [{ address: address1 }, { address: address2 }],
      })

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveDelay()

      expect(await responsePromise).toEqual({
        statusCode: 200,
        result: null,
        data: {
          decimals: 7,
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: requestTimestamp,
          providerDataReceivedUnixMs: responseTimestamp,
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      log.mockClear()
    })
  })
})
