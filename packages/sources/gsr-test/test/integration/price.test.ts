import * as process from 'process'
import { AddressInfo } from 'net'
import { AdapterRequestBody, sleep } from '@chainlink/external-adapter-framework/util'
import { mockWebSocketProvider, mockWebSocketServer, createAdapter, setEnvVariables } from './setup'
import { ServerInstance, expose } from '@chainlink/external-adapter-framework'
import request, { SuperTest, Test } from 'supertest'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Server } from 'mock-socket'
import { mockTokenSuccess } from './fixtures'

describe('websocket', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let mockWsServer: Server | undefined
  let spy: jest.SpyInstance
  const wsEndpoint = 'ws://localhost:9090'

  jest.setTimeout(30_000)

  const data: AdapterRequestBody = {
    data: {
      base: 'ETH',
      quote: 'USD',
    },
  }

  let oldEnv: NodeJS.ProcessEnv
  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['WS_SUBSCRIPTION_TTL'] = '50000'
    process.env['CACHE_MAX_AGE'] = '5000'
    process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
    process.env['METRICS_ENABLED'] = 'false'
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['WS_USER_ID'] = process.env['WS_USER_ID'] || 'test-user-id'
    process.env['WS_PUBLIC_KEY'] = process.env['WS_PUBLIC_KEY'] || 'test-pub-key'
    process.env['WS_PRIVATE_KEY'] = process.env['WS_PRIVATE_KEY'] || 'test-priv-key'
    const mockDate = new Date('2022-05-10T16:09:27.193Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    // Start mock web socket server
    mockTokenSuccess()
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockWebSocketServer(wsEndpoint)

    fastify = await expose(createAdapter())
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

    // Send initial request to start background execute
    await req.post('/').send(data)
    await sleep(5_000)
  })

  afterAll((done) => {
    spy.mockRestore()
    setEnvVariables(oldEnv)
    mockWsServer?.close()
    fastify?.close(done())
  })

  describe('websocket endpoint', () => {
    it('should return success', async () => {
      const makeRequest = () =>
        req
          .post('/')
          .send(data)
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
          .send({ data: { quote: 'USD' } })
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
})
