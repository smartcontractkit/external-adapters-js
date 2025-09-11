import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/virtune'
import { HttpTransportTypes, VirtuneTransport } from '../../src/transport/virtune'

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
metrics.initialize()

describe('VirtuneTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'virtune'
  const virtuneApiKey = 'A_123'

  const adapterSettings = makeStub('adapterSettings', {
    VIRTUNE_API_URL:
      'https://proof-of-reserves-chainlink-283003lt.nw.gateway.dev/api/external/proof-of-reserves/',
    VIRTUNE_API_KEY: virtuneApiKey,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    CACHE_MAX_AGE: 90_000,
    MAX_COMMON_KEY_SIZE: 300,
    //DEFAULT_CACHE_KEY: 'default-cache-key',
  } as unknown as HttpTransportTypes['Settings'])

  const subscriptionSet = makeStub('subscriptionSet', {
    getAll: jest.fn(),
  })

  const subscriptionSetFactory = makeStub('subscriptionSetFactory', {
    buildSet() {
      return subscriptionSet
    },
  })

  const requester = {
    request: jest.fn(),
  }
  const responseCache = {
    write: jest.fn(),
  }
  const dependencies = makeStub('dependencies', {
    requester,
    responseCache,
    subscriptionSetFactory,
  } as unknown as TransportDependencies<HttpTransportTypes>)

  let transport: VirtuneTransport

  const requestKeyForParams = (params: typeof inputParameters.validated) => {
    const requestKey = calculateHttpRequestKey<HttpTransportTypes>({
      context: {
        adapterSettings,
        inputParameters,
        endpointName,
      },
      data: [params],
      transportName,
    })
    return requestKey
  }

  beforeEach(async () => {
    restoreEnv()
    jest.resetAllMocks()
    jest.useFakeTimers()

    transport = new VirtuneTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  const testTransport = async ({
    params,
    expectedRequestConfig,
    response,
    expectedResponse,
  }: {
    params: typeof inputParameters.validated
    expectedRequestConfig: unknown
    response: unknown
    expectedResponse: unknown
  }): Promise<void> => {
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestKey = requestKeyForParams(params)

    expect(requester.request).toHaveBeenCalledWith(
      expectedRequestKey,
      expectedRequestConfig,
      undefined,
    )
    expect(requester.request).toHaveBeenCalledTimes(1)

    expect(responseCache.write).toHaveBeenCalledWith(transportName, [
      {
        params,
        response: expectedResponse,
      },
    ])
    expect(responseCache.write).toHaveBeenCalledTimes(1)
  }

  it('should cache a response for a successful request', async () => {
    const accountId = 'VIRBTC'
    const network = 'bitcoin'
    const chainId = 'mainnet'
    const address1 = 'addr1'
    const address2 = 'addr2'

    const params = makeStub('params', {
      accountId,
      network,
      chainId,
    })

    const expectedRequestConfig = {
      baseURL: adapterSettings.VIRTUNE_API_URL,
      params: {
        key: virtuneApiKey,
      },
      url: accountId,
    }

    const response = makeStub('response', {
      response: {
        data: {
          result: [
            {
              wallets: [{ address: address1 }, { address: address2 }],
            },
          ],
          cost: undefined,
        },
      },
      timestamps: {},
    })

    const expectedResponse = {
      data: {
        result: [
          { address: address1, network, chainId },
          { address: address2, network, chainId },
        ],
      },
      result: null,
      timestamps: {},
    }

    await testTransport({
      params,
      expectedRequestConfig,
      response,
      expectedResponse,
    })
  })

  it('should cache an error if the response has no data', async () => {
    const accountId = 'VIRBTC'
    const network = 'bitcoin'
    const chainId = 'mainnet'

    const params = makeStub('params', {
      accountId,
      network,
      chainId,
    })

    const response = {
      response: {},
      timestamps: {},
    }

    const expectedRequestConfig = {
      baseURL: adapterSettings.VIRTUNE_API_URL,
      params: {
        key: virtuneApiKey,
      },
      url: accountId,
    }

    const expectedResponse = {
      errorMessage: "The data provider didn't return any data for virtune",
      statusCode: 502,
      timestamps: {},
    }

    await testTransport({
      params,
      expectedRequestConfig,
      response,
      expectedResponse,
    })
  })

  it('should cache an error if the reeponse has no addresses', async () => {
    const accountId = 'VIRBTC'
    const network = 'bitcoin'
    const chainId = 'mainnet'

    const params = makeStub('params', {
      accountId,
      network,
      chainId,
    })

    const response = makeStub('response', {
      response: {
        data: {
          result: [
            {
              wallets: [],
            },
          ],
          cost: undefined,
        },
      },
      timestamps: {},
    })

    const expectedRequestConfig = {
      baseURL: adapterSettings.VIRTUNE_API_URL,
      params: {
        key: virtuneApiKey,
      },
      url: accountId,
    }

    const expectedResponse = {
      errorMessage: "The data provider didn't return any address for virtune",
      statusCode: 502,
      timestamps: {},
    }

    await testTransport({
      params,
      expectedRequestConfig,
      response,
      expectedResponse,
    })
  })
})
