import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
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
  const GROUP_SIZE = 3

  const adapterSettings = makeStub('adapterSettings', {
    XRPL_RPC_URL,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    BACKGROUND_EXECUTE_MS,
    GROUP_SIZE,
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

  const mockLineBalances = (balances: string[] | Promise<string[]>) => {
    requester.request.mockImplementationOnce(async () => {
      return {
        response: {
          data: {
            result: {
              lines: (await balances).map((expectedBalance) => ({
                balance: expectedBalance,
              })),
            },
          },
        },
      }
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

  describe('getTotalTokenBalance', () => {
    it('should return the token balance of multiple addresses', async () => {
      const address1 = 'r101'
      const address2 = 'r102'
      const tokenIssuerAddress = 'r456'
      mockLineBalances(['100.0'])
      mockLineBalances(['200.0'])

      const expectedRequestConfig1 = requestConfigForAddresses({
        address: address1,
        tokenIssuerAddress,
      })
      const expectedRequestKey1 = requestKeyForConfig(expectedRequestConfig1)

      const expectedRequestConfig2 = requestConfigForAddresses({
        address: address2,
        tokenIssuerAddress,
      })
      const expectedRequestKey2 = requestKeyForConfig(expectedRequestConfig2)

      const balance = await transport.getTotalTokenBalance({
        addresses: [{ address: address1 }, { address: address2 }],
        tokenIssuerAddress,
      })

      expect(balance).toEqual(new Decimal(300))

      expect(requester.request).toHaveBeenNthCalledWith(
        1,
        expectedRequestKey1,
        expectedRequestConfig1,
      )
      expect(requester.request).toHaveBeenNthCalledWith(
        2,
        expectedRequestKey2,
        expectedRequestConfig2,
      )
      expect(requester.request).toBeCalledTimes(2)

      expect(log).toHaveBeenNthCalledWith(
        1,
        `Generated HTTP request queue key: "${expectedRequestKey1}"`,
      )
      expect(log).toHaveBeenNthCalledWith(
        2,
        `Generated HTTP request queue key: "${expectedRequestKey2}"`,
      )
      expect(log).toBeCalledTimes(2)
      log.mockClear()
    })

    it('should wait for the first group of RPCs to finish before sending the next group', async () => {
      const [lines1, resolveLines1] = deferredPromise<string[]>()
      const [lines2, resolveLines2] = deferredPromise<string[]>()
      const [lines3, resolveLines3] = deferredPromise<string[]>()
      const [lines4, resolveLines4] = deferredPromise<string[]>()

      const address1 = 'r101'
      const address2 = 'r102'
      const address3 = 'r103'
      const address4 = 'r104'
      const tokenIssuerAddress = 'r456'
      mockLineBalances(lines1)
      mockLineBalances(lines2)
      mockLineBalances(lines3)
      mockLineBalances(lines4)

      const balancePromise = transport.getTotalTokenBalance({
        addresses: [
          { address: address1 },
          { address: address2 },
          { address: address3 },
          { address: address4 },
        ],
        tokenIssuerAddress,
      })

      await jest.runAllTimersAsync()

      // Only 3 of the 4 requests were made because GROUP_SIZE is 3
      expect(requester.request).toBeCalledTimes(3)

      resolveLines1(['101.0'])
      resolveLines2(['102.0'])

      await jest.runAllTimersAsync()
      expect(requester.request).toBeCalledTimes(3)

      resolveLines3(['103.0'])

      await jest.runAllTimersAsync()
      expect(requester.request).toBeCalledTimes(4)

      resolveLines4(['104.0'])

      expect(await balancePromise).toEqual(new Decimal(410))

      expect(log).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('Generated HTTP request queue key:'),
      )
      expect(log).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('Generated HTTP request queue key:'),
      )
      expect(log).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining('Generated HTTP request queue key:'),
      )
      expect(log).toHaveBeenNthCalledWith(
        4,
        expect.stringContaining('Generated HTTP request queue key:'),
      )
      expect(log).toBeCalledTimes(4)
      log.mockClear()
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
