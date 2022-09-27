import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import { AddressInfo } from 'net'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import {
  mockSubscribeWSResponse,
  mockUnsubscribeWSResponse,
  mockSubscribeResponse,
  mockUnsubscribeResponse,
} from './fixtures'
import {
  mockWebSocketFlow,
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'
import * as nock from 'nock'

describe('websocket', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  let fastify: FastifyInstance
  let req: SuperTest<Test>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'
    process.env.API_KEY = process.env.API_KEY ?? 'test-api-key'
    process.env.WS_SUBSCRIPTION_TTL = '3000'

    if (!process.env.RECORD) {
      mockedWsServer = mockWebSocketServer('wss://api.chk.elwood.systems/v1/stream')
      mockWebSocketProvider(WebSocketClassProvider)
    } else {
      nock.recorder.rec()
    }

    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    process.env = oldEnv
    fastify.close(done)
  })

  describe('price endpoint', () => {
    it('should return success', async () => {
      mockSubscribeResponse()
      mockUnsubscribeResponse()
      const data: AdapterRequest = {
        id: '1',
        data: {
          base: 'ETH',
          quote: 'USD',
        },
      }

      let flowFulfilled: Promise<boolean> | undefined
      if (!process.env.RECORD) {
        flowFulfilled = mockWebSocketFlow(mockedWsServer, [
          mockSubscribeWSResponse,
          mockUnsubscribeWSResponse,
        ])
      }

      const response = await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      expect(response.body).toMatchSnapshot()
      return !process.env.RECORD ? await flowFulfilled : undefined
    }, 10_000)
  })
})
