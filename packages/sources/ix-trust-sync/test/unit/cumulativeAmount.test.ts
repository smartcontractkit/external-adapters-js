import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { calculateHttpRequestKey } from '@chainlink/external-adapter-framework/cache'
import { metrics } from '@chainlink/external-adapter-framework/metrics'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { inputParameters } from '../../src/endpoint/cumulativeAmount'
import {
  ATTESTATION_QUERY,
  CumulativeAmountHttpTransport,
  HttpTransportTypes,
  ResponseSchema,
} from '../../src/transport/cumulativeAmount'

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

describe('CumulativeAmountHttpTransport', () => {
  const transportName = 'default_single_transport'
  const endpointName = 'cumulativeAmount'

  const apiEndpoint = 'http://test.api.url'
  const apiKey = 'test-api-key'

  const auditorAddress = '0x92F78491093bA0dd88A419b1BF07aeb3BA9fD0dc'
  const fractionalContractAddress = '0xd051c326C9Aef673428E6F01eb65d2C52De95D30'
  const chainId = 1
  const expectedValue = '5954903980000'

  const adapterSettings = makeStub('adapterSettings', {
    API_ENDPOINT: apiEndpoint,
    API_KEY: apiKey,
    WARMUP_SUBSCRIPTION_TTL: 10_000,
    CACHE_MAX_AGE: 90_000,
    MAX_COMMON_KEY_SIZE: 300,
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

  let transport: CumulativeAmountHttpTransport

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

    transport = new CumulativeAmountHttpTransport()

    await transport.initialize(dependencies, adapterSettings, endpointName, transportName)
  })

  it('should make the request', async () => {
    const params = makeStub('params', {
      auditorAddress,
      fractionalContractAddress,
      chainId,
    })
    subscriptionSet.getAll.mockReturnValue([params])

    const context = makeStub('context', {
      adapterSettings,
      endpointName,
    } as EndpointContext<HttpTransportTypes>)

    const apiResponseData: ResponseSchema = {
      results: [
        {
          type: 'ok',
          response: {
            type: 'execute',
            result: {
              cols: [
                {
                  name: 'attestation_data',
                  decltype: 'TEXT',
                },
                {
                  name: 'signature',
                  decltype: 'TEXT',
                },
              ],
              rows: [
                [
                  {
                    type: 'text',
                    value:
                      '{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"NAVAttestation":[{"name":"contractAddress","type":"address"},{"name":"navContractAddress","type":"address"},{"name":"decimals","type":"uint8"},{"name":"amount","type":"uint256"},{"name":"cumulativeAmount","type":"uint256"},{"name":"validFrom","type":"uint256"},{"name":"validTo","type":"uint256"},{"name":"nonce","type":"bytes32"}]},"primaryType":"NAVAttestation","domain":{"name":"RWA Attestation","version":"1","chainId":"1","verifyingContract":"0x0000000000000000000000000000000000000000"},"message":{"contractAddress":"0xd051c326C9Aef673428E6F01eb65d2C52De95D30","navContractAddress":"0x95dc5a797f657391fb5a20bf2846475bb26c8b1a","decimals":8,"amount":"2479938340000","cumulativeAmount":"5954903980000","validFrom":"1765429200","validTo":"0","nonce":"0x03f506db0529a245a5afc10348f5426b13e6b18abe63a4670562422cc8826de1"}}',
                  },
                  {
                    type: 'text',
                    value:
                      '0xe4181569bcba9819eb8629cd1ce16d45798fb23904a16143c40781c369dee8e431fe72040ee729157b568e25179c1ce2ad831db5290897d5324a187b3d5e922b1b',
                  },
                ],
              ],
              affected_row_count: 0,
              last_insert_rowid: null,
              replication_index: null,
              rows_read: 28,
              rows_written: 0,
              query_duration_ms: 0.153,
            },
          },
        },
        {
          type: 'ok',
          response: {
            type: 'close',
          },
        },
      ],
    }

    const response = makeStub('response', {
      response: {
        data: {
          ...apiResponseData,
          cost: undefined,
        },
      },
      timestamps: {},
    })

    requester.request.mockResolvedValue(response)

    await transport.backgroundExecute(context)

    const expectedRequestConfig = {
      method: 'POST',
      baseURL: apiEndpoint,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      data: {
        requests: [
          {
            type: 'execute',
            stmt: {
              sql: ATTESTATION_QUERY,
              named_args: [
                { name: 'auditor_address', value: { type: 'text', value: auditorAddress } },
                {
                  name: 'fractional_address',
                  value: { type: 'text', value: fractionalContractAddress },
                },
                { name: 'chain_id', value: { type: 'integer', value: String(chainId) } },
              ],
            },
          },
          { type: 'close' },
        ],
      },
    }
    const expectedRequestKey = requestKeyForParams(params)

    const expectedResponse = {
      data: {
        cumulativeAmount: expectedValue,
        decimals: 8,
      },
      result: expectedValue,
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
