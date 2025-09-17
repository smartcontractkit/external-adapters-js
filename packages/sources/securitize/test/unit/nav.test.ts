import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/nav'
import { HttpTransportTypes, NavTransport } from '../../src/transport/nav'

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

describe('NavTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'nav'

  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT: 'https://partners-api.securitize.io/asset-metrics/api/v1/nav',
    API_KEY: 'fake-api-key',
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    CACHE_MAX_AGE: 90_000,
    MAX_COMMON_KEY_SIZE: 300,
    DEFAULT_CACHE_KEY: 'default-cache-key',
  } as unknown as HttpTransportTypes['Settings'])

  const subscriptionSet = makeStub('subscriptionSet', {
    getAll: jest.fn(),
  })

  const subscriptionSetFactory = makeStub('subscriptionSetFactory', {
    buildSet() {
      return subscriptionSet
    },
  })

  const requester = makeStub('requester', {
    request: jest.fn(),
  })

  const responseCache = {
    write: jest.fn(),
  }
  const dependencies = makeStub('dependencies', {
    requester,
    responseCache,
    subscriptionSetFactory,
  } as unknown as TransportDependencies<HttpTransportTypes>)

  let transport: NavTransport

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
    jest.restoreAllMocks()
    jest.useFakeTimers()

    transport = new NavTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  it('should make the request', async () => {
    const assetId = 'abc123'
    const expectedNav = 123.45
    const dateString = '2025-09-11T00:00:00.000Z'
    const dateStringAsTime = 1757548800000

    const params = makeStub('params', {
      assetId,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          docs: [
            {
              assetId: assetId,
              nav: expectedNav,
              recordDate: dateString,
            },
          ],
          cost: {},
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestConfig = {
      headers: {
        apikey: adapterSettings.API_KEY,
      },
      baseURL: adapterSettings.API_ENDPOINT,
      params: {
        assetId,
        sortBy: 'recordDate',
        sortOrder: 'DESC',
        page: 1,
        limit: 1,
      },
    }
    const expectedRequestKey = requestKeyForParams(params)

    const expectedResponse = {
      data: {
        result: expectedNav,
      },
      result: expectedNav,
      timestamps: {
        providerIndicatedTimeUnixMs: dateStringAsTime,
      },
    }

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
  })
})
