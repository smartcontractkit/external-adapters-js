import request, { SuperTest, Test } from 'supertest'
import {
  createAdapter,
  mockWebSocketProvider,
  mockWebSocketServer,
  setEnvVariables,
} from './setup-ws'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import process from 'process'
import { AddressInfo } from 'net'
import { Server } from 'mock-socket'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { sleep } from '@chainlink/external-adapter-framework/util'

describe('execute', () => {
  describe('crypto endpoint websocket', () => {
    beforeAll(async () => {
      const mockDate = new Date('2022-01-01T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
    })

    afterAll((done) => {
      spy.mockRestore()
      done()
    })
    let fastify: ServerInstance | undefined
    let req: SuperTest<Test>
    let mockWsServer: Server | undefined
    let spy: jest.SpyInstance
    const wsEndpoint = 'ws://localhost:9090'

    jest.setTimeout(100_000)

    const data = {
      data: {
        endpoint: 'crypto',
        base: 'ETH',
        quote: 'BTC',
        transport: 'ws',
      },
    }

    let oldEnv: NodeJS.ProcessEnv
    beforeAll(async () => {
      oldEnv = JSON.parse(JSON.stringify(process.env))
      process.env['WS_SUBSCRIPTION_TTL'] = '10000'
      process.env['CACHE_MAX_AGE'] = '10000'
      process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
      process.env['METRICS_ENABLED'] = 'false'
      process.env['WS_API_ENDPOINT'] = wsEndpoint
      process.env['API_KEY'] = 'fake-api-key'
      process.env['WS_ENABLED'] = 'true'
      const mockDate = new Date('2022-11-11T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      mockWebSocketProvider(WebSocketClassProvider)
      mockWsServer = mockWebSocketServer(wsEndpoint)

      fastify = await expose(createAdapter())
      req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

      // Send initial request to start background execute
      await req.post('/').send(data)
      await sleep(5000)
    })

    afterAll((done) => {
      spy.mockRestore()
      setEnvVariables(oldEnv)
      mockWsServer?.close()
      fastify?.close(done())
    })

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
})
