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
import { sleep } from '@chainlink/external-adapter-framework/util'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { mockConnectionTime } from './icap_fixtures'
import { PriceEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter'
import { TypeFromDefinition } from '@chainlink/external-adapter-framework/validation/input-params'

type AdapterRequest = {
  data?: TypeFromDefinition<PriceEndpointInputParametersDefinition>
}

describe('Price Endpoint', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let mockPriceWsServer: Server | undefined
  let spy: jest.SpyInstance

  const makeRequest = (body: AdapterRequest) =>
    req
      .post('')
      .send(body)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)

  jest.setTimeout(10000)

  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    const wsEndpoint = 'ws://localhost:9099'

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['METRICS_ENABLED'] = 'false'
    process.env['WS_API_USERNAME'] = 'test-username'
    process.env['WS_API_PASSWORD'] = 'test-password'
    process.env['WS_API_ENDPOINT'] = wsEndpoint

    spy = jest.spyOn(Date, 'now').mockReturnValue(mockConnectionTime.getTime())

    mockWebSocketProvider(WebSocketClassProvider)
    mockPriceWsServer = mockPriceWebSocketServer(wsEndpoint)

    fastify = await expose(createAdapter())
    req = request(
      `http://localhost:${(fastify?.server.address() as AddressInfo).port}?streamName=ic`,
    )

    // Send initial request to start background execute
    await req.post('/').send({ data: { base: 'JPY', quote: 'USD' } })
    await sleep(5000)
  })

  afterAll((done) => {
    spy.mockRestore()
    setEnvVariables(oldEnv)
    mockPriceWsServer?.close()
    fastify?.close(done())
  })

  it('should succeed with CAD/USD', async () => {
    const response = await makeRequest({ data: { base: 'CAD', quote: 'USD' } })
    expect(response.body).toMatchSnapshot()
  }, 30000)

  it('should succeed with USD/CAD', async () => {
    const response = await makeRequest({ data: { base: 'USD', quote: 'CAD' } })
    expect(response.body).toMatchSnapshot()
  }, 30000)

  it('should return price', async () => {
    const response = await makeRequest({ data: { base: 'EUR', quote: 'USD' } })
    expect(response.body).toMatchSnapshot()
  }, 30000)

  it('should return price for inverse pair', async () => {
    const response = await makeRequest({ data: { base: 'IDR', quote: 'USD' } })
    expect(response.body).toMatchSnapshot()
  }, 30000)

  it('should return price for specific source', async () => {
    const response = await makeRequest({ data: { base: 'EUR', quote: 'USD', sourceName: 'BGK' } })
    expect(response.body).toMatchSnapshot()
  }, 30000)

  it('should return error when queried for TP price', async () => {
    const response = await makeRequest({ data: { base: 'ABC', quote: 'USD' } })
    expect(response.body).toMatchSnapshot()
  }, 30000)

  it('should return error when queried for stale price', async () => {
    const response = await makeRequest({ data: { base: 'JPY', quote: 'USD' } })
    expect(response.body).toMatchSnapshot()
  }, 30000)

  it('should return error on empty body', async () => {
    const response = await makeRequest({})
    expect(response.body).toMatchSnapshot()
  }, 30000)

  it('should return error on empty data', async () => {
    const response = await makeRequest({ data: {} })
    expect(response.body).toMatchSnapshot()
  }, 30000)

  it('should return error on empty base', async () => {
    const response = await makeRequest({ data: { quote: 'USD' } })
    expect(response.body).toMatchSnapshot()
  }, 30000)

  it('should return error on empty quote', async () => {
    const response = await makeRequest({ data: { base: 'EUR' } })
    expect(response.body).toMatchSnapshot()
  }, 30000)
})
