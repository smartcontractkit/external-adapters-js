import * as process from 'process'
import { AddressInfo } from 'net'
import { AdapterRequestBody, sleep } from '@chainlink/external-adapter-framework/util'
import {
  createAdapter,
  mockCryptoLwbaWebSocketServer,
  mockWebSocketProvider,
  setEnvVariables,
} from './setup-ws'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import request, { SuperTest, Test } from 'supertest'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { Server } from 'mock-socket'

describe('websocket', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let mockWsServer: Server | undefined
  let spy: jest.SpyInstance
  const wsEndpoint = 'ws://localhost:9090/v4/timeseries-stream/asset-quotes'

  jest.setTimeout(30_000)

  const data: AdapterRequestBody = {
    data: {
      endpoint: 'crypto-lwba',
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
    process.env['WS_API_ENDPOINT'] = wsEndpoint
    process.env['API_KEY'] = 'someKey'

    // Start mock web socket server
    mockWebSocketProvider(WebSocketClassProvider)
    mockWsServer = mockCryptoLwbaWebSocketServer(wsEndpoint)

    const mockDate = new Date('2022-05-10T16:09:27.193Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

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
      expect(response.body).toEqual({
        result: 1562.3733948803842,
        mid: 1562.3733948803842,
        ask: 1562.4083581615457,
        asksize: 31.63132041,
        bid: 1562.3384315992228,
        bidsize: 64.67517577,
        spread: 0.000044756626394287605,
        statusCode: 200,
        data: {
          result: 1562.3733948803842,
        },
        timestamps: {
          providerDataReceivedUnixMs: 1652198967193,
          providerDataStreamEstablishedUnixMs: 1652198967193,
          providerIndicatedTimeUnixMs: 1678248273750,
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
          .send({ data: { endpoint: 'crypto-lwba' } })
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
          .send({ data: { endpoint: 'crypto-lwba', quote: 'USD' } })
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
          .send({ data: { endpoint: 'crypto-lwba', base: 'ETH' } })
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)

      const response = await makeRequest()
      expect(response.statusCode).toEqual(400)
    }, 30000)
  })
})
