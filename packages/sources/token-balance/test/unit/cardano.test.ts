import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { BaseEndpointTypes, inputParameters } from '../../src/endpoint/cardano'
import { CardanoTransport } from '../../src/transport/cardano'

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

describe('CardanoTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'cardano'
  const CARDANO_RPC_URL = 'https://cardano.rpc.url'
  const BACKGROUND_EXECUTE_MS = 1500
  const GROUP_SIZE = 3

  const adapterSettings = makeStub('adapterSettings', {
    CARDANO_RPC_URL,
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

  let transport: CardanoTransport

  type RequestConfig = {
    baseURL: string
    method: 'GET'
    url: string
  }

  const requestConfigForAddresses = ({ address }: { address: string }): RequestConfig => ({
    baseURL: adapterSettings.CARDANO_RPC_URL,
    method: 'GET',
    url: `/api/v1/addresses/${encodeURIComponent(address)}/amounts`,
  })

  const requestKeyForConfig = (requestConfig: RequestConfig) => {
    const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings,
        inputParameters,
        endpointName,
      },
      data: { url: requestConfig.url },
      transportName,
    })
    expect(log).toBeCalledWith(`Generated HTTP request queue key: "${requestKey}"`)
    expect(log).toBeCalledTimes(1)
    log.mockClear()
    return requestKey
  }

  const mockLovelaceBalance = (balance: string | Promise<string>) => {
    requester.request.mockImplementationOnce(async () => {
      const quantity = await Promise.resolve(balance)
      return {
        response: {
          data: [{ unit: 'lovelace', quantity }],
        },
      }
    })
  }

  const mockMixedAmountsResponse = (
    rows: {
      unit: string
      quantity: string
    }[],
  ) => {
    requester.request.mockImplementationOnce(async () => ({
      response: {
        data: rows,
      },
    }))
  }

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new CardanoTransport()

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
      const address = 'addr101'
      const balance = 123

      mockLovelaceBalance(balance.toString())

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
      const address1 = 'addr101'
      const address2 = 'addr102'
      const balance1 = 100
      const balance2 = 200

      mockLovelaceBalance(balance1.toString())
      mockLovelaceBalance(balance2.toString())

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
      const address = 'addr101'
      const balance = 100

      const [balancePromise, resolveBalance] = deferredPromise<string>()
      mockLovelaceBalance(balancePromise)

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
      const address1 = 'addr101'
      const address2 = 'addr102'
      mockLovelaceBalance('100')
      mockLovelaceBalance('200')

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
        { address: address1, balance: '100' },
        { address: address2, balance: '200' },
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

      const address1 = 'addr101'
      const address2 = 'addr102'
      const address3 = 'addr103'
      const address4 = 'addr104'
      mockLovelaceBalance(balance1)
      mockLovelaceBalance(balance2)
      mockLovelaceBalance(balance3)
      mockLovelaceBalance(balance4)

      const balancePromise = transport.getTokenBalances([
        { address: address1 },
        { address: address2 },
        { address: address3 },
        { address: address4 },
      ])

      await jest.runAllTimersAsync()

      // Only 3 of the 4 requests were made because GROUP_SIZE is 3
      expect(requester.request).toBeCalledTimes(3)

      resolveLines1('101')
      resolveLines2('102')

      await jest.runAllTimersAsync()
      expect(requester.request).toBeCalledTimes(3)

      resolveLines3('103')

      await jest.runAllTimersAsync()
      expect(requester.request).toBeCalledTimes(4)

      resolveLines4('104')

      expect(await balancePromise).toEqual([
        { address: address1, balance: '101' },
        { address: address2, balance: '102' },
        { address: address3, balance: '103' },
        { address: address4, balance: '104' },
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
    const address = 'addr123'

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
      const expectedBalance = '123456'

      mockLovelaceBalance(expectedBalance)

      const balance = await transport.getTokenBalance(address)

      expect(balance).toEqual(expectedBalance)
      expectRequesterRequest()
    })

    it('should sum only lovelace when response includes other units', async () => {
      mockMixedAmountsResponse([
        { unit: 'asset1deadbeef', quantity: '999999999999' },
        { unit: 'lovelace', quantity: '50' },
        { unit: 'lovelace', quantity: '100' },
        { unit: 'other', quantity: '1' },
      ])

      const balance = await transport.getTokenBalance(address)

      expect(balance).toEqual('150')
      expectRequesterRequest()
    })

    it('should return 0 when amounts array is empty', async () => {
      requester.request.mockImplementationOnce(async () => ({
        response: { data: [] },
      }))

      const balance = await transport.getTokenBalance(address)

      expect(balance).toEqual('0')
      expectRequesterRequest()
    })

    it('should return 0 when there is no lovelace row', async () => {
      mockMixedAmountsResponse([{ unit: 'only-asset', quantity: '1000' }])

      const balance = await transport.getTokenBalance(address)

      expect(balance).toEqual('0')
      expectRequesterRequest()
    })

    it('should throw if CARDANO_RPC_URL is missing', async () => {
      transport = new CardanoTransport()
      await transport.initialize(
        dependencies,
        {
          ...adapterSettings,
          CARDANO_RPC_URL: '',
        },
        endpointName,
        transportName,
      )

      await expect(() => transport.getTokenBalance(address)).rejects.toThrow(
        'Environment variable CARDANO_RPC_URL is missing',
      )
    })
  })
})
