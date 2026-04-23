import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { deferredPromise, LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { BaseEndpointTypes, inputParameters, RequestParams } from '../../src/endpoint/reserves'
import { ReservesTransport, ReservesTransportTypes } from '../../src/transport/reserves'

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

describe('ReservesTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'reserves'
  const BACKGROUND_EXECUTE_MS = 10_000

  const PROVIDER_URLS = {
    'por-address-list': 'https://por.address.list',
    'token-balance': 'https://token.balance',
    'view-function-multi-chain': 'https://view.function.multi.chain',
  }

  const adapterSettings = makeStub('adapterSettings', {
    MAX_RESPONSE_TEXT_IN_ERROR_MESSAGE: 20,
    BACKGROUND_EXECUTE_MS,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    MAX_COMMON_KEY_SIZE: 300,
  } as unknown as BaseEndpointTypes['Settings'])

  const context = makeStub('context', {
    adapterSettings,
    endpointName,
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
  } as unknown as TransportDependencies<ReservesTransportTypes>)

  let transport: ReservesTransport

  type RequestConfig = {
    url: string
    method: 'POST'
    data: { data: Record<string, unknown> }
  }

  const requestConfigForProvider = (
    provider: keyof typeof PROVIDER_URLS,
    params: Record<string, unknown>,
  ): RequestConfig => ({
    url: PROVIDER_URLS[provider],
    method: 'POST',
    data: {
      data: params,
    },
  })

  const requestKeyForConfig = (requestConfig: RequestConfig) => {
    const requestKey = calculateHttpRequestKey<BaseEndpointTypes>({
      context: {
        adapterSettings,
        inputParameters,
        endpointName,
      },
      data: requestConfig.data.data,
      transportName,
    })
    return requestKey
  }

  const mockFetchData = (
    provider: keyof typeof PROVIDER_URLS,
    params: Record<string, unknown>,
    responseData: Record<string, unknown> | Promise<unknown>,
  ) => {
    const requestConfig = requestConfigForProvider(provider, params)
    const requestKey = requestKeyForConfig(requestConfig)

    requester.request.mockImplementationOnce(async (key, config) => {
      expect(key).toBe(requestKey)
      expect(config).toEqual(requestConfig)
      return {
        response: {
          data: await responseData,
        },
      }
    })
  }

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    for (const [key, value] of Object.entries(PROVIDER_URLS)) {
      process.env[`${key.toUpperCase().replace(/-/g, '_')}_URL`] = value
    }

    transport = new ReservesTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)

    requester.request.mockResolvedValue(makeStub('unexpectedResponse', {}))
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
      const addressListParams = { endpoint: 'multiAddressList' }
      const balanceParams = { endpoint: 'evm' }
      const addressArray = [{ address: '0x123' }]

      mockFetchData('por-address-list', addressListParams, {
        data: {
          result: addressArray,
        },
      })

      mockFetchData(
        'token-balance',
        { ...balanceParams, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '123000',
                decimals: 6,
              },
            ],
          },
        },
      )

      const param = makeStub('param', {
        addressLists: [
          {
            name: 'list1',
            fixed: undefined,
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'data.result',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balanceParams),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 6,
      } as unknown as RequestParams)

      await transport.handleRequest(context, param)

      const expectedResponse = {
        statusCode: 200,
        result: '123000',
        data: {
          decimals: 6,
          result: '123000',
          resultAsNumber: 0.123,
          components: [
            {
              name: 'component1',
              currency: 'USDC',
              totalBalance: 0.123,
              addressCount: 1,
            },
          ],
          conversionRates: [],
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

      expect(requester.request).toBeCalledTimes(2)
    })

    it('should cache an error if balance provider returns an error', async () => {
      const addressListParams = { endpoint: 'multiAddressList' }
      const balanceParams = { endpoint: 'evm' }
      const addressArray = [{ address: '0x123' }]
      const providerError = new AdapterError({
        statusCode: 504,
        message: 'The EA has not received any values from the Data Provider',
      })

      mockFetchData('por-address-list', addressListParams, {
        data: {
          result: addressArray,
        },
      })

      mockFetchData(
        'token-balance',
        { ...balanceParams, addresses: addressArray },
        Promise.reject(providerError),
      )

      const param = makeStub('param', {
        addressLists: [
          {
            name: 'list1',
            fixed: undefined,
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'data.result',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balanceParams),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 6,
      } as unknown as RequestParams)

      await transport.handleRequest(context, param)

      const expectedErrorMessage = `Error processing component 'component1': Error fetching data from provider 'token-balance' at 'https://token.balance': The EA has not received any values from the Data Provider`

      const expectedResponse = {
        statusCode: 502,
        errorMessage: expectedErrorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
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

      expect(requester.request).toBeCalledTimes(2)

      expect(log).toBeCalledWith(
        new AdapterError({
          statusCode: 502,
          message: expectedErrorMessage,
        }),
        expectedErrorMessage,
      )
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })

    it('should cache an error if address array cannot be found', async () => {
      const addressListParams = { endpoint: 'multiAddressList' }
      const balanceParams = { endpoint: 'evm' }
      const addressArray = [{ address: '0x123' }]

      mockFetchData('por-address-list', addressListParams, {
        data: {
          result: addressArray,
        },
      })

      mockFetchData(
        'token-balance',
        { ...balanceParams, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '123000',
                decimals: 6,
              },
            ],
          },
        },
      )

      const param = makeStub('param', {
        addressLists: [
          {
            name: 'list1',
            fixed: undefined,
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'wrong.path',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balanceParams),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 6,
      } as unknown as RequestParams)

      await transport.handleRequest(context, param)

      const expectedErrorMessage = `Error processing component 'component1': Address array not found at path 'wrong.path' in response '{"data":{"result":[{...' from provider 'por-address-list'`

      const expectedResponse = {
        statusCode: 500,
        errorMessage: expectedErrorMessage,
        timestamps: {
          providerDataRequestedUnixMs: 0,
          providerDataReceivedUnixMs: 0,
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

      expect(log).toBeCalledWith(
        new AdapterError({
          statusCode: 502,
          message: expectedErrorMessage,
        }),
        expectedErrorMessage,
      )
      expect(log).toBeCalledTimes(1)
      log.mockClear()
    })
  })

  describe('_handleRequest', () => {
    it('should return reserves', async () => {
      const addressListParams = { endpoint: 'multiAddressList' }
      const balanceParams = { endpoint: 'evm' }
      const addressArray = [{ address: '0x123' }]

      mockFetchData('por-address-list', addressListParams, {
        data: {
          result: addressArray,
        },
      })

      mockFetchData(
        'token-balance',
        { ...balanceParams, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '123000',
                decimals: 6,
              },
            ],
          },
        },
      )

      const param = makeStub('param', {
        addressLists: [
          {
            name: 'list1',
            fixed: undefined,
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'data.result',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balanceParams),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 6,
      } as unknown as RequestParams)

      const response = await transport._handleRequest(context, param)

      const expectedResponse = {
        statusCode: 200,
        result: '123000',
        data: {
          decimals: 6,
          result: '123000',
          resultAsNumber: 0.123,
          components: [
            {
              name: 'component1',
              currency: 'USDC',
              totalBalance: 0.123,
              addressCount: 1,
            },
          ],
          conversionRates: [],
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(response).toEqual(expectedResponse)

      expect(requester.request).toBeCalledTimes(2)
    })

    it('should convert currency', async () => {
      const addressListParams = { endpoint: 'multiAddressList' }
      const balanceParams = { endpoint: 'evm' }
      const viewFunctionParams = { endpoint: 'viewFunction' }
      const addressArray = [{ address: '0x123' }]

      mockFetchData('por-address-list', addressListParams, {
        data: {
          result: addressArray,
        },
      })

      mockFetchData('view-function-multi-chain', viewFunctionParams, {
        data: {
          result: '0x00000000000e664992288f22800000', // 68000 in hex with 18 decimals
          decimals: '0x000000000000000000000000000012',
        },
      })

      mockFetchData(
        'token-balance',
        { ...balanceParams, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '136000000000',
                decimals: 6,
              },
            ],
          },
        },
      )

      const param = makeStub('param', {
        addressLists: [
          {
            name: 'list1',
            fixed: undefined,
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'data.result',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balanceParams),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: ['USDC/BTC'],
          },
        ],
        conversions: [
          {
            from: 'BTC',
            to: 'USDC',
            provider: 'view-function-multi-chain',
            params: JSON.stringify(viewFunctionParams),
            ratePath: 'data.result',
            decimalsPath: 'data.decimals',
          },
        ],
        resultDecimals: 6,
      } as unknown as RequestParams)

      const response = await transport._handleRequest(context, param)

      const expectedResponse = {
        statusCode: 200,
        result: '2000000',
        data: {
          decimals: 6,
          result: '2000000',
          resultAsNumber: 2,
          components: [
            {
              name: 'component1',
              currency: 'BTC',
              totalBalance: 2,
              addressCount: 1,
              originalCurrency: 'USDC',
              totalBalanceInOriginalCurrency: {
                amount: '136000000000',
                decimals: 6,
              },
            },
          ],
          conversionRates: [
            {
              from: 'BTC',
              to: 'USDC',
              rate: 68000,
            },
          ],
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(response).toEqual(expectedResponse)

      expect(requester.request).toBeCalledTimes(3)
    })

    it('should add up multiple balances from one response', async () => {
      const addressListParams = { endpoint: 'multiAddressList' }
      const balanceParams = { endpoint: 'evm' }
      const addressArray = [{ address: '0x123' }]

      mockFetchData('por-address-list', addressListParams, {
        data: {
          result: addressArray,
        },
      })

      mockFetchData(
        'token-balance',
        { ...balanceParams, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '123000',
                decimals: 6,
              },
              {
                balance: '456000',
                decimals: 6,
              },
            ],
          },
        },
      )

      const param = makeStub('param', {
        addressLists: [
          {
            name: 'list1',
            fixed: undefined,
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'data.result',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balanceParams),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 6,
      } as unknown as RequestParams)

      const response = await transport._handleRequest(context, param)

      const expectedResponse = {
        statusCode: 200,
        result: '579000',
        data: {
          decimals: 6,
          result: '579000',
          resultAsNumber: 0.579,
          components: [
            {
              name: 'component1',
              currency: 'USDC',
              totalBalance: 0.579,
              addressCount: 2,
            },
          ],
          conversionRates: [],
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(response).toEqual(expectedResponse)

      expect(requester.request).toBeCalledTimes(2)
    })

    it('should add up multiple reserve components', async () => {
      const addressListParams = { endpoint: 'multiAddressList' }
      const balance1Params = { endpoint: 'evm' }
      const balance2Params = { endpoint: 'solana' }
      const addressArray = [{ address: '0x123' }]

      mockFetchData('por-address-list', addressListParams, {
        data: {
          result: addressArray,
        },
      })

      mockFetchData(
        'token-balance',
        { ...balance1Params, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '123000',
                decimals: 6,
              },
            ],
          },
        },
      )

      mockFetchData(
        'token-balance',
        { ...balance2Params, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '456000000',
                decimals: 9,
              },
            ],
          },
        },
      )

      const param = makeStub('param', {
        addressLists: [
          {
            name: 'list1',
            fixed: undefined,
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'data.result',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balance1Params),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
          {
            name: 'source2',
            provider: 'token-balance',
            params: JSON.stringify(balance2Params),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: [],
          },
          {
            name: 'component2',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source2',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 9,
      } as unknown as RequestParams)

      const response = await transport._handleRequest(context, param)

      const expectedResponse = {
        statusCode: 200,
        result: '579000000',
        data: {
          decimals: 9,
          result: '579000000',
          resultAsNumber: 0.579,
          components: [
            {
              name: 'component1',
              currency: 'USDC',
              totalBalance: 0.123,
              addressCount: 1,
            },
            {
              name: 'component2',
              currency: 'USDC',
              totalBalance: 0.456,
              addressCount: 1,
            },
          ],
          conversionRates: [],
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(response).toEqual(expectedResponse)

      expect(requester.request).toBeCalledTimes(3)
    })

    it('should add up multiple reserve components with different decimals', async () => {
      const addressListParams = { endpoint: 'multiAddressList' }
      const balance1Params = { endpoint: 'evm' }
      const balance2Params = { endpoint: 'solana' }
      const addressArray = [{ address: '0x123' }]

      mockFetchData('por-address-list', addressListParams, {
        data: {
          result: addressArray,
        },
      })

      mockFetchData(
        'token-balance',
        { ...balance1Params, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '123000',
                decimals: 6,
              },
            ],
          },
        },
      )

      mockFetchData(
        'token-balance',
        { ...balance2Params, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '456000',
                decimals: 6,
              },
            ],
          },
        },
      )

      const param = makeStub('param', {
        addressLists: [
          {
            name: 'list1',
            fixed: undefined,
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'data.result',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balance1Params),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
          {
            name: 'source2',
            provider: 'token-balance',
            params: JSON.stringify(balance2Params),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: [],
          },
          {
            name: 'component2',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source2',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 6,
      } as unknown as RequestParams)

      const response = await transport._handleRequest(context, param)

      const expectedResponse = {
        statusCode: 200,
        result: '579000',
        data: {
          decimals: 6,
          result: '579000',
          resultAsNumber: 0.579,
          components: [
            {
              name: 'component1',
              currency: 'USDC',
              totalBalance: 0.123,
              addressCount: 1,
            },
            {
              name: 'component2',
              currency: 'USDC',
              totalBalance: 0.456,
              addressCount: 1,
            },
          ],
          conversionRates: [],
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(response).toEqual(expectedResponse)

      expect(requester.request).toBeCalledTimes(3)
    })

    it('should add up multiple reserve components with different currencies', async () => {
      const addressListParams = { endpoint: 'multiAddressList' }
      const balance1Params = { endpoint: 'evm' }
      const balance2Params = { endpoint: 'solana' }
      const ethRateParams = { endpoint: 'viewFunction', contract: 'ethereum' }
      const solRateParams = { endpoint: 'viewFunction', contract: 'solana' }
      const addressArray = [{ address: '0x123' }]

      mockFetchData('por-address-list', addressListParams, {
        data: {
          result: addressArray,
        },
      })

      mockFetchData('view-function-multi-chain', ethRateParams, {
        data: {
          result: '2400000000000000000000',
          decimals: '18',
        },
      })

      mockFetchData('view-function-multi-chain', solRateParams, {
        data: {
          result: '67000000000000000000',
          decimals: '18',
        },
      })

      mockFetchData(
        'token-balance',
        { ...balance1Params, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '1000000',
                decimals: 6,
              },
            ],
          },
        },
      )

      mockFetchData(
        'token-balance',
        { ...balance2Params, addresses: addressArray },
        {
          data: {
            wallets: [
              {
                balance: '100000',
                decimals: 6,
              },
            ],
          },
        },
      )

      const param = makeStub('param', {
        addressLists: [
          {
            name: 'list1',
            fixed: undefined,
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'data.result',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balance1Params),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
          {
            name: 'source2',
            provider: 'token-balance',
            params: JSON.stringify(balance2Params),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'ETH',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: ['ETH/USD'],
          },
          {
            name: 'component2',
            currency: 'SOL',
            addressList: 'list1',
            balanceSource: 'source2',
            conversions: ['SOL/USD'],
          },
        ],
        conversions: [
          {
            from: 'ETH',
            to: 'USD',
            provider: 'view-function-multi-chain',
            params: JSON.stringify(ethRateParams),
            ratePath: 'data.result',
            decimalsPath: 'data.decimals',
          },
          {
            from: 'SOL',
            to: 'USD',
            provider: 'view-function-multi-chain',
            params: JSON.stringify(solRateParams),
            ratePath: 'data.result',
            decimalsPath: 'data.decimals',
          },
        ],
        resultDecimals: 6,
      } as unknown as RequestParams)

      const response = await transport._handleRequest(context, param)

      const expectedResponse = {
        statusCode: 200,
        result: '2406700000',
        data: {
          decimals: 6,
          result: '2406700000',
          resultAsNumber: 2406.7,
          components: [
            {
              name: 'component1',
              currency: 'USD',
              totalBalance: 2400,
              addressCount: 1,
              originalCurrency: 'ETH',
              totalBalanceInOriginalCurrency: {
                amount: '1000000',
                decimals: 6,
              },
            },
            {
              name: 'component2',
              currency: 'USD',
              totalBalance: 6.7,
              addressCount: 1,
              originalCurrency: 'SOL',
              totalBalanceInOriginalCurrency: {
                amount: '100000',
                decimals: 6,
              },
            },
          ],
          conversionRates: [
            {
              from: 'ETH',
              to: 'USD',
              rate: 2400,
            },
            {
              from: 'SOL',
              to: 'USD',
              rate: 67,
            },
          ],
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(response).toEqual(expectedResponse)

      expect(requester.request).toBeCalledTimes(5)
    })

    it('should set address array into existing balanceSource params field', async () => {
      const addressListParams = { endpoint: 'multiAddressList' }
      const balanceParams = { endpoint: 'evm', nested: { field: 'value' } }
      const addressArray = [{ address: '0x123' }]
      const balanceParamsWithAddresses = {
        endpoint: 'evm',
        nested: { field: 'value', addresses: addressArray },
      }

      mockFetchData('por-address-list', addressListParams, {
        data: {
          result: addressArray,
        },
      })

      mockFetchData('token-balance', balanceParamsWithAddresses, {
        data: {
          wallets: [
            {
              balance: '123000',
              decimals: 6,
            },
          ],
        },
      })

      const param = makeStub('param', {
        addressLists: [
          {
            name: 'list1',
            fixed: undefined,
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'data.result',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balanceParams),
            addressArrayPath: 'nested.addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 6,
      } as unknown as RequestParams)

      const response = await transport._handleRequest(context, param)

      const expectedResponse = {
        statusCode: 200,
        result: '123000',
        data: {
          decimals: 6,
          result: '123000',
          resultAsNumber: 0.123,
          components: [
            {
              name: 'component1',
              currency: 'USDC',
              totalBalance: 0.123,
              addressCount: 1,
            },
          ],
          conversionRates: [],
        },
        timestamps: {
          providerDataRequestedUnixMs: Date.now(),
          providerDataReceivedUnixMs: Date.now(),
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(response).toEqual(expectedResponse)

      expect(requester.request).toBeCalledTimes(2)
    })

    it('should record received timestamp separate from requested timestamp', async () => {
      const addressListParams = { endpoint: 'multiAddressList' }
      const balanceParams = { endpoint: 'evm' }
      const addressArray = [{ address: '0x123' }]

      const [balancePromise, resolveBalance] = deferredPromise<Record<string, unknown>>()

      mockFetchData('por-address-list', addressListParams, {
        data: {
          result: addressArray,
        },
      })

      mockFetchData('token-balance', { ...balanceParams, addresses: addressArray }, balancePromise)

      const param = makeStub('param', {
        addressLists: [
          {
            name: 'list1',
            fixed: undefined,
            provider: 'por-address-list',
            params: JSON.stringify(addressListParams),
            addressArrayPath: 'data.result',
          },
        ],
        balanceSources: [
          {
            name: 'source1',
            provider: 'token-balance',
            params: JSON.stringify(balanceParams),
            addressArrayPath: 'addresses',
            balancesArrayPath: 'data.wallets',
            balancePath: 'balance',
            decimalsPath: 'decimals',
          },
        ],
        components: [
          {
            name: 'component1',
            currency: 'USDC',
            addressList: 'list1',
            balanceSource: 'source1',
            conversions: [],
          },
        ],
        conversions: [],
        resultDecimals: 6,
      } as unknown as RequestParams)

      const requestTimestamp = Date.now()
      const responsePromise = transport._handleRequest(context, param)
      jest.advanceTimersByTime(1234)
      const responseTimestamp = Date.now()
      expect(responseTimestamp).toBeGreaterThan(requestTimestamp)

      resolveBalance({
        data: {
          wallets: [
            {
              balance: '123000',
              decimals: 6,
            },
          ],
        },
      })

      const expectedResponse = {
        statusCode: 200,
        result: '123000',
        data: {
          decimals: 6,
          result: '123000',
          resultAsNumber: 0.123,
          components: [
            {
              name: 'component1',
              currency: 'USDC',
              totalBalance: 0.123,
              addressCount: 1,
            },
          ],
          conversionRates: [],
        },
        timestamps: {
          providerDataRequestedUnixMs: requestTimestamp,
          providerDataReceivedUnixMs: responseTimestamp,
          providerIndicatedTimeUnixMs: undefined,
        },
      }

      expect(await responsePromise).toEqual(expectedResponse)

      expect(requester.request).toBeCalledTimes(2)
    })
  })
})
