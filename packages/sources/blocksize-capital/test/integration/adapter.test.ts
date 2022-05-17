import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'
import { mockLoginResponse, mockSubscribeResponse, mockUnsubscribeResponse } from './fixtures'
import { AddressInfo } from 'net'
import {
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
  mockWebSocketFlow,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'
import { DEFAULT_BASE_WS_URL } from '../../src/config'

let oldEnv: NodeJS.ProcessEnv

describe('websocket', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'

    if (!process.env.RECORD) {
      mockedWsServer = mockWebSocketServer(DEFAULT_BASE_WS_URL)
      mockWebSocketProvider(WebSocketClassProvider)
      process.env.API_KEY = 'fake-api-key'
      process.env.WS_SUBSCRIPTION_TTL = '100'
    } else {
      process.env.WS_SUBSCRIPTION_TTL = '3000'
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
      const data: AdapterRequest = {
        id: '1',
        data: {
          base: 'ETH',
          quote: 'EUR',
        },
      }

      let flowFulfilled: Promise<boolean>
      if (!process.env.RECORD) {
        flowFulfilled = mockWebSocketFlow(mockedWsServer, [
          mockLoginResponse,
          mockSubscribeResponse,
          mockUnsubscribeResponse,
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

      await flowFulfilled
    })
  })
})
