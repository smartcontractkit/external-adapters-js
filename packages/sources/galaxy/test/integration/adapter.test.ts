import * as process from 'process'
import { AddressInfo } from 'net'
import {
  mockWebSocketProvider,
  mockPriceWebSocketServer,
  createAdapter,
  setEnvVariables,
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
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['METRICS_ENABLED'] = 'false'
    process.env['API_ENDPOINT'] = tokenEndpoint
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_API_KEY'] = 'test-key'
    process.env['WS_API_PASSWORD'] = 'test-password'
    process.env['RATE_LIMIT_CAPACITY_SECOND'] = '2'
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
    const makeRequest = () =>
      req
        .post('/')
        .send(priceData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.body).toEqual({
      result: 1279.2012582120603,
      statusCode: 200,
      data: { result: 1279.2012582120603 },
      timestamps: {
        providerDataReceivedUnixMs: 1652198967193,
        providerDataStreamEstablishedUnixMs: 1652198967193,
        providerIndicatedTimeUnixMs: 1667970828970,
      },
    })
  }, 30000)
  it('should return error (empty body)', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send({})
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.statusCode).toEqual(400)
  }, 30000)
  it('should return error (empty data)', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send({ data: {} })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.statusCode).toEqual(400)
  }, 30000)
  it('should return error (empty base)', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send({ data: { quote: 'BTC' } })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.statusCode).toEqual(400)
  }, 30000)
  it('should return error (empty quote)', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send({ data: { base: 'ETH' } })
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.statusCode).toEqual(400)
  }, 30000)
})
