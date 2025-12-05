import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/batch-index'
import { HttpTransportTypes, IndexTransport } from '../../src/transport/batch-index'

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
metrics.initialize()

describe('IndexTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'batch-index'

  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT: 'https://dataproviderapi.com/mytest',
    API_KEY: 'apikey',
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    CACHE_MAX_AGE: 1_200_000,
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

  let transport: IndexTransport

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

    transport = new IndexTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  it('should make the request', async () => {
    const indices = ['abc123', 'def456']
    const expectedLevel_0 = 123.45
    const expectedPct1_0 = 1.0
    const expectedPct12_0 = 0.5
    const expectedLevel_1 = 456.78
    const expectedPct1_1 = 2.0
    const expectedPct12_1 = 0.1

    const params = makeStub('params', {
      indices,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const response = makeStub('response', {
      response: {
        data: {
          cost: {},
          Results: {
            series: [
              {
                seriesID: 'abc123',
                data: [
                  {
                    value: `${expectedLevel_0}`,
                    calculations: {
                      pct_changes: {
                        '1': `${expectedPct1_0}`,
                        '12': `${expectedPct12_0}`,
                      },
                    },
                  },
                ],
              },
              {
                seriesID: 'def456',
                data: [
                  {
                    value: `${expectedLevel_1}`,
                    calculations: {
                      pct_changes: {
                        '1': `${expectedPct1_1}`,
                        '12': `${expectedPct12_1}`,
                      },
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestConfig = {
      method: 'POST',
      baseURL: adapterSettings.API_ENDPOINT,
      data: {
        seriesid: indices,
        latest: true,
        calculations: true,
        registrationkey: adapterSettings.API_KEY,
      },
    }
    const expectedRequestKey = requestKeyForParams(params)

    const expectedResponse = {
      data: {
        abc123: {
          level: expectedLevel_0,
          pct1mo: expectedPct1_0,
          pct12mo: expectedPct12_0,
        },
        def456: {
          level: expectedLevel_1,
          pct1mo: expectedPct1_1,
          pct12mo: expectedPct12_1,
        },
      },
      result: null,
      timestamps: {},
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
