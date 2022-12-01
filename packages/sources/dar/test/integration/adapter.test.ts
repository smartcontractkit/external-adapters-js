import * as process from 'process'
import { AddressInfo } from 'net'
import {
  mockWebSocketProvider,
  mockPriceWebSocketServer,
  createAdapter,
  setEnvVariables,
  getAdapterResponse,
} from './setup'
import request, { SuperTest, Test } from 'supertest'
import { Server } from 'mock-socket'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { AdapterRequestBody, sleep } from '@chainlink/external-adapter-framework/util'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Adapter } from '@chainlink/external-adapter-framework/adapter'
import { mockTokenResponse } from './fixtures'

describe('Price Endpoint', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let mockPriceWsServer: Server | undefined
  let spy: jest.SpyInstance
  const tokenEndpoint = process.env.API_ENDPOINT || 'https://test-url.com'
  const wsEndpoint = process.env.WS_API_ENDPOINT || 'ws://localhost:9090'

  const envVars = {
    WS_SUBSCRIPTION_TTL: '5000',
    CACHE_MAX_AGE: '5000',
    CACHE_POLLING_MAX_RETRIES: '0',
    METRICS_ENABLED: 'false',
    API_ENDPOINT: tokenEndpoint,
    WS_API_ENDPOINT: wsEndpoint,
    WS_API_KEY: 'test-key',
    WS_API_USERNAME: 'test-user',
    RATE_LIMIT_CAPACITY_SECOND: '2',
  }

  jest.setTimeout(10000)

  const priceData: AdapterRequestBody = {
    data: {
      base: 'ETH',
      quote: 'USD',
    },
  }

  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    setEnvVariables(envVars)
    const mockDate = new Date('2022-05-10T16:09:27.193Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    mockTokenResponse()
    mockWebSocketProvider(WebSocketClassProvider)
    mockPriceWsServer = mockPriceWebSocketServer(wsEndpoint)

    fastify = await expose(createAdapter() as unknown as Adapter)
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

    // Send initial request to start background execute
    await req.post('/').send(priceData)
    await sleep(5000)
  })

  afterAll((done) => {
    spy.mockRestore()
    setEnvVariables(oldEnv)
    mockPriceWsServer?.close()
    fastify?.close(done())
  })

  it('should return success', async () => {
    const response = await getAdapterResponse(req, priceData)
    const expected = {
      result: 1272.12,
      statusCode: 200,
      data: { result: 1272.12 },
      timestamps: {
        providerDataReceived: 1652198967193,
        providerDataStreamEstablished: 1652198967193,
        providerIndicatedTime: 1669808788232,
      },
    }
    expect(response.body).toEqual(expected)
  }, 30000)

  it('should return error (empty body)', async () => {
    const response = await getAdapterResponse(req, {})
    expect(response.statusCode).toEqual(400)
  }, 30000)

  it('should return error (empty data)', async () => {
    const response = await getAdapterResponse(req, { data: {} })
    expect(response.statusCode).toEqual(400)
  }, 30000)

  it('should return error (empty base)', async () => {
    const response = await getAdapterResponse(req, { data: { quote: 'BTC' } })
    expect(response.statusCode).toEqual(400)
  }, 30000)

  it('should return error (empty quote)', async () => {
    const response = await getAdapterResponse(req, { data: { base: 'ETH' } })
    expect(response.statusCode).toEqual(400)
  }, 30000)
})
