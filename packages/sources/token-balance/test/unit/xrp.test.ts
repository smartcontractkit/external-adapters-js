import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/xrp'
import { XrpTransport } from '../../src/transport/xrp'

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
}

const loggerFactory = { child: () => logger }

LoggerFactoryProvider.set(loggerFactory)

describe('XrpTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'xrp'
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

  let transport: XrpTransport

  type RequestConfig = {
    baseURL: string
    method: 'POST'
    data: {
      method: 'account_info'
      params: [
        {
          account: string
          ledger_index: 'validated'
        },
      ]
    }
  }

  const requestConfigForAddresses = ({ address }: { address: string }): RequestConfig => ({
    baseURL: adapterSettings.XRPL_RPC_URL,
    method: 'POST',
    data: {
      method: 'account_info',
      params: [
        {
          account: address,
          ledger_index: 'validated',
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

  const mockAccountInfo = (balance: string | Promise<string>) => {
    requester.request.mockImplementationOnce(async () => {
      return {
        response: {
          data: {
            result: {
              account_data: {
                Balance: await balance,
              },
            },
          },
        },
      }
    })
  }

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new XrpTransport()

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
      const balance = 123

      mockAccountInfo(balance.toString())

      const param = makeStub('param', {
        addresses: [{ address }],
      })
      await transport.handleRequest(context, param)

      const expectedResult = [
        {
          address,
          balance: balance.toString(),
        },
      ]

      const expectedResponse = {
        statusCode: 200,
        result: null,
        data: {
          decimals: 6,
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
      const address1 = 'r101'
      const address2 = 'r102'
      const balance1 = 100
      const balance2 = 200

      mockAccountInfo(balance1.toString())
      mockAccountInfo(balance2.toString())

      const param = makeStub('param', {
        addresses: [{ address: address1 }, { address: address2 }],
      })
      const response = await transport._handleRequest(param)

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
      expect(response).toEqual({
        statusCode: 200,
        result: null,
        data: {
          decimals: 6,
          result: expectedResult,
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      })

      expect(log).toHaveBeenNthCalledWith(
        1,
        expect.stringContaining('Generated HTTP request queue key:'),
      )
      expect(log).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('Generated HTTP request queue key:'),
      )
      expect(log).toBeCalledTimes(2)
      log.mockClear()
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const address = 'r101'
      const balance = 100

      const [balancePromise, resolveBalance] = deferredPromise<string>()
      mockAccountInfo(balancePromise)

      const param = makeStub('param', {
        addresses: [{ address }],
      })

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveBalance(balance.toString())

      const expectedResult = [
        {
          address,
          balance: balance.toString(),
        },
      ]
      expect(await responsePromise).toEqual({
        statusCode: 200,
        result: null,
        data: {
          decimals: 6,
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

  describe('getTotalTokenBalance', () => {
    it('should return the token balance of multiple addresses', async () => {
      const address1 = 'r101'
      const address2 = 'r102'
      mockAccountInfo('100.0')
      mockAccountInfo('200.0')

      const expectedRequestConfig1 = requestConfigForAddresses({
        address: address1,
      })
      const expectedRequestKey1 = requestKeyForConfig(expectedRequestConfig1)

      const expectedRequestConfig2 = requestConfigForAddresses({
        address: address2,
      })
      const expectedRequestKey2 = requestKeyForConfig(expectedRequestConfig2)

      const balances = await transport.getTokenBalances([
        { address: address1 },
        { address: address2 },
      ])

      expect(balances).toEqual([
        { address: address1, balance: '100.0' },
        { address: address2, balance: '200.0' },
      ])

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
      const [balance1, resolveLines1] = deferredPromise<string>()
      const [balance2, resolveLines2] = deferredPromise<string>()
      const [balance3, resolveLines3] = deferredPromise<string>()
      const [balance4, resolveLines4] = deferredPromise<string>()

      const address1 = 'r101'
      const address2 = 'r102'
      const address3 = 'r103'
      const address4 = 'r104'
      mockAccountInfo(balance1)
      mockAccountInfo(balance2)
      mockAccountInfo(balance3)
      mockAccountInfo(balance4)

      const balancePromise = transport.getTokenBalances([
        { address: address1 },
        { address: address2 },
        { address: address3 },
        { address: address4 },
      ])

      await jest.runAllTimersAsync()

      // Only 3 of the 4 requests were made because GROUP_SIZE is 3
      expect(requester.request).toBeCalledTimes(3)

      resolveLines1('101.0')
      resolveLines2('102.0')

      await jest.runAllTimersAsync()
      expect(requester.request).toBeCalledTimes(3)

      resolveLines3('103.0')

      await jest.runAllTimersAsync()
      expect(requester.request).toBeCalledTimes(4)

      resolveLines4('104.0')

      expect(await balancePromise).toEqual([
        { address: address1, balance: '101.0' },
        { address: address2, balance: '102.0' },
        { address: address3, balance: '103.0' },
        { address: address4, balance: '104.0' },
      ])

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

    const expectedRequestConfig = requestConfigForAddresses({
      address,
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

      mockAccountInfo(expectedBalance)

      const balance = await transport.getTokenBalance(address)

      expect(balance).toEqual(expectedBalance)
      expectRequesterRequest()
    })

    it('should throw if XRPL_RPC_URL is missing', async () => {
      transport = new XrpTransport()
      await transport.initialize(
        dependencies,
        {
          ...adapterSettings,
          XRPL_RPC_URL: '',
        },
        endpointName,
        transportName,
      )

      await expect(() => transport.getTokenBalance(address)).rejects.toThrow(
        'Environment variable XRPL_RPC_URL is missing',
      )
    })
  })
})
