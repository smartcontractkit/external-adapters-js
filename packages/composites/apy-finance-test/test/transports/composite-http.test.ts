import { expose } from '@chainlink/external-adapter-framework'
import {
  Adapter,
  AdapterEndpoint,
  AdapterParams,
  EndpointContext,
} from '@chainlink/external-adapter-framework/adapter'
import {
  EmptyCustomSettings,
  SettingsDefinitionMap,
} from '@chainlink/external-adapter-framework/config'
import { SingleNumberResultResponse, sleep } from '@chainlink/external-adapter-framework/util'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AddressInfo } from 'net'
import request from 'supertest'
import { CompositeHttpTransport } from '../../src/transports/composite-http'
import nock from 'nock'

const inputParameters = new InputParameters({
  path: {
    description: 'Path to fetch data from',
    type: 'string',
    required: true,
  },
})

const validPath = 'VALID_PATH'
const validResponse = 'VALID_RESPONSE'
const mockDataProviderUrl = 'http://localhost:5432'

type CompositeHttpTransportTypes = {
  Parameters: typeof inputParameters.definition
  Response: SingleNumberResultResponse
  Settings: EmptyCustomSettings
}

class MockCompositeHttpTransport extends CompositeHttpTransport<CompositeHttpTransportTypes> {
  backgroundExecuteCalls = 0

  constructor() {
    super({
      performRequest: async (params, _adapterSettings, requestHandler) => {
        const result = await requestHandler<number>({
          url: `${mockDataProviderUrl}/${params.path}`,
          method: 'POST',
          data: {
            input: params.path,
          },
        }).then((res) => res.data)

        return {
          params: params,
          response: {
            data: {
              result: result,
            },
            result: result,
            timestamps: {
              providerDataRequestedUnixMs: Date.now(),
              providerDataReceivedUnixMs: Date.now(),
              providerIndicatedTimeUnixMs: undefined,
            },
          },
        }
      },
    })
  }

  override async backgroundExecute(
    context: EndpointContext<CompositeHttpTransportTypes>,
  ): Promise<void> {
    const entries = await this.subscriptionSet.getAll()
    if (entries.length) {
      this.backgroundExecuteCalls++
    }
    return super.backgroundExecute(context)
  }
}

const createAndExposeAdapter = async (
  params: Partial<AdapterParams<SettingsDefinitionMap>> = {},
) => {
  // Disable retries to make the testing flow easier
  process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
  process.env['RETRY'] = '0'
  process.env['BACKGROUND_EXECUTE_MS_HTTP'] = '1000'

  nock(mockDataProviderUrl, { encodedQueryParams: true })
    .persist()
    .post(`/${validPath}`)
    .reply(200, validResponse)

  const transport = new MockCompositeHttpTransport()
  const adapter = new Adapter({
    name: 'TEST',
    defaultEndpoint: 'test',
    endpoints: [
      new AdapterEndpoint({
        name: 'test',
        inputParameters,
        transport,
      }),
    ],
    ...params,
  })

  const fastify = await expose(adapter)
  const req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)
  return { transport, adapter, fastify, req }
}

describe('composite-http transport', () => {
  test('returns data fetched by background execute', async () => {
    const { fastify, req } = await createAndExposeAdapter()

    // Send initial request to start background execute
    await req.post('/').send({ data: { path: validPath } })
    await sleep(1000)

    const { statusCode, data, result } = await req
      .post('/')
      .send({ data: { path: validPath } })
      .then((res) => res.body)

    expect(statusCode).toBe(200)
    expect(data.result).toBe(validResponse)
    expect(result).toBe(validResponse)

    await fastify?.close()
    nock.restore()
    nock.cleanAll()
  })

  test('per second rate limit of 1 results in a call every second', async () => {
    const { transport, fastify, req } = await createAndExposeAdapter({
      rateLimiting: {
        tiers: {
          default: {
            rateLimit1s: 1,
          },
        },
      },
    })

    // Send initial request to start background execute
    await req.post('/').send({ data: { path: validPath } })

    await sleep(3000)

    expect(transport.backgroundExecuteCalls).toBe(3)

    await fastify?.close()
    nock.restore()
    nock.cleanAll()
  })
})
