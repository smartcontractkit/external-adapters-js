import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import Decimal from 'decimal.js'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/xrpl'
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
  const XRPL_RPC_URL = 'https://xrpl.rpc.url'
  const BACKGROUND_EXECUTE_MS = 1500

  const adapterSettings = makeStub('adapterSettings', {
    XRPL_RPC_URL,
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

  let transport: XrplTransport

  type RequestConfig = {
    baseURL: string
    method: string
    data: {
      method: string
      params: [
        {
          account: string
          ledger_index: string
          peer: string
        },
      ]
    }
  }

  const requestConfigForAddresses = ({
    address,
    tokenIssuerAddress,
  }: {
    address: string
    tokenIssuerAddress: string
  }): RequestConfig => ({
    baseURL: adapterSettings.XRPL_RPC_URL,
    method: 'POST',
    data: {
      method: 'account_lines',
      params: [
        {
          account: address,
          ledger_index: 'validated',
          peer: tokenIssuerAddress,
        },
      ],
    },
  })

  const requestKeyForConfig = (requestConfig: RequestConfig) => {
    const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings,
        inputParameters,
        endpointName,
      },
      data: requestConfig.data,
      transportName,
    })
    expect(log).toBeCalledWith(`Generated HTTP request queue key: "${requestKey}"`)
    expect(log).toBeCalledTimes(1)
    log.mockClear()
    return requestKey
  }

  const mockLineBalances = (balances: string[]) => {
    requester.request.mockResolvedValueOnce({
      response: {
        data: {
          result: {
            lines: balances.map((expectedBalance) => ({
              balance: expectedBalance,
            })),
          },
        },
      },
    })
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new XrplTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  afterEach(() => {
    expect(log).not.toBeCalled()
  })

  describe('initialize', () => {
    it('should log if XRPL_RPC_URL is missing', async () => {
      transport = new XrplTransport()
      await transport.initialize(
        dependencies,
        {
          ...adapterSettings,
          XRPL_RPC_URL: '',
        },
        endpointName,
        transportName,
      )

      expect(log).toBeCalledWith('Environment variable XRPL_RPC_URL is missing')
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })
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

  describe('getTokenBalance', () => {
    const address = 'r123'
    const tokenIssuerAddress = 'r456'

    const expectedRequestConfig = requestConfigForAddresses({
      address,
      tokenIssuerAddress,
    })

    const requestKey = requestKeyForConfig(expectedRequestConfig)

    const expectRequesterRequest = () => {
      expect(requester.request).toBeCalledWith(requestKey, expectedRequestConfig)
      expect(requester.request).toBeCalledTimes(1)

      expect(log).toBeCalledWith(`Generated HTTP request queue key: "${requestKey}"`)
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    }

    it('should return the token balance', async () => {
      const expectedBalance = '1234.56'

      mockLineBalances([expectedBalance])

      const balance = await transport.getTokenBalance({
        address,
        tokenIssuerAddress,
      })

      expect(balance).toEqual(new Decimal(expectedBalance))
      expectRequesterRequest()
    })

    it('should add balance from multiple lines', async () => {
      mockLineBalances(['100.00', '200.00', '300.00'])

      const balance = await transport.getTokenBalance({
        address,
        tokenIssuerAddress,
      })

      expect(balance).toEqual(new Decimal(600))
      expectRequesterRequest()
    })

    it('should throw if XRPL_RPC_URL is missing', async () => {
      transport = new XrplTransport()
      await transport.initialize(
        dependencies,
        {
          ...adapterSettings,
          XRPL_RPC_URL: '',
        },
        endpointName,
        transportName,
      )

      await expect(() =>
        transport.getTokenBalance({
          address,
          tokenIssuerAddress,
        }),
      ).rejects.toThrow('Environment variable XRPL_RPC_URL is missing')
      expect(log).toBeCalledWith('Environment variable XRPL_RPC_URL is missing')
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })
  })
})
