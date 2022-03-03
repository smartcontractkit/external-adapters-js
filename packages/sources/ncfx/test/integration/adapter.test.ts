import { AdapterRequest } from '@chainlink/ea-bootstrap'
import { server as startServer } from '../../src'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'
import { mockLoginResponse, mockSubscribeResponse, mockUnsubscribeResponse } from './fixtures'
import {
  mockWebSocketFlow,
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'

let oldEnv: NodeJS.ProcessEnv

describe('price-beth', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'

    if (!process.env.RECORD) {
      mockedWsServer = mockWebSocketServer('wss://feed.newchangefx.com/cryptodata')
      mockWebSocketProvider(WebSocketClassProvider)
      process.env.API_USERNAME = 'user'
      process.env.API_PASSWORD = 'pass'
      process.env.WS_SUBSCRIPTION_TTL = '100'
    } else {
      // Give enough time for request to complete, but shut down connection afterwards
      process.env.WS_SUBSCRIPTION_TTL = '3000'
    }

    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    process.env = oldEnv
    server.close(done)
  })

  describe('successful calls', () => {
    const jobID = '1'

    it('return value when fetching the USD/ETH price', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          from: 'ETH',
          to: 'USD',
        },
      }

      let flowFulfilled
      if (!process.env.RECORD)
        flowFulfilled = mockWebSocketFlow(mockedWsServer, [
          mockLoginResponse,
          mockSubscribeResponse,
          mockUnsubscribeResponse,
        ])

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
