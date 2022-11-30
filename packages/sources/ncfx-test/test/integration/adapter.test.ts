import * as process from 'process'
import { AddressInfo } from 'net'
import {
  mockWebSocketProvider,
  mockCryptoWebSocketServer,
  createAdapter,
  setEnvVariables,
  mockForexWebSocketServer,
} from './setup'
import request, { SuperTest, Test } from 'supertest'
import { Server } from 'mock-socket'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { AdapterRequestBody, sleep } from '@chainlink/external-adapter-framework/util'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'

describe('Crypto Endpoint', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let mockCryptoWsServer: Server | undefined
  let spy: jest.SpyInstance
  const wsCryptoEndpoint = 'ws://localhost:9090'

  jest.setTimeout(10000)

  const cryptoData: AdapterRequestBody = {
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
    process.env['WS_API_ENDPOINT'] = wsCryptoEndpoint
    process.env['RATE_LIMIT_CAPACITY_SECOND'] = '2'
    process.env['API_USERNAME'] = 'test-api-username'
    process.env['API_PASSWORD'] = 'test-api-password'
    process.env['FOREX_WS_USERNAME'] = 'test-forex-api-username'
    process.env['FOREX_WS_PASSWORD'] = 'test-forex-api-password'
    const mockDate = new Date('2022-08-01T07:14:54.909Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    mockWebSocketProvider(WebSocketClassProvider)
    mockCryptoWsServer = mockCryptoWebSocketServer(wsCryptoEndpoint)

    fastify = await expose(createAdapter())
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

    // Send initial request to start background execute
    await req.post('/').send(cryptoData)
    await sleep(5000)
  })

  afterAll((done) => {
    spy.mockRestore()
    setEnvVariables(oldEnv)
    mockCryptoWsServer?.close()
    fastify?.close(done())
  })
  it('should return success', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send(cryptoData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.body).toMatchSnapshot()
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

describe('Forex endpoint', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let mockForexWsServer: Server | undefined
  let spy: jest.SpyInstance
  const wsForexEndpoint = 'ws://localhost:9090'

  jest.setTimeout(10000)

  const forexData: AdapterRequestBody = {
    data: {
      base: 'CAD',
      quote: 'USD',
      endpoint: 'forex',
    },
  }

  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_SUBSCRIPTION_TTL'] = '5000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['METRICS_ENABLED'] = 'false'
    process.env['FOREX_WS_API_ENDPOINT'] = wsForexEndpoint
    process.env['RATE_LIMIT_CAPACITY_SECOND'] = '2'
    process.env['API_USERNAME'] = 'te`st-api-username'
    process.env['API_PASSWORD'] = 'test-api-password'
    process.env['FOREX_WS_USERNAME'] = 'test-forex-api-username'
    process.env['FOREX_WS_PASSWORD'] = '`test-forex-api-password'
    const mockDate = new Date('2022-08-01T07:14:54.909Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    mockWebSocketProvider(WebSocketClassProvider)
    mockForexWsServer = mockForexWebSocketServer(wsForexEndpoint)

    fastify = await expose(createAdapter())
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

    // Send initial request to start background execute
    await req.post('/').send(forexData)
    await sleep(5000)
  })

  afterAll((done) => {
    spy.mockRestore()
    setEnvVariables(oldEnv)
    mockForexWsServer?.close()
    fastify?.close(done())
  })

  it('should return success', async () => {
    const makeRequest = () =>
      req
        .post('/')
        .send(forexData)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)

    const response = await makeRequest()
    expect(response.body).toMatchSnapshot()
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
