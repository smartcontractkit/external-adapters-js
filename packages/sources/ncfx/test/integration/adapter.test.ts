import { AdapterRequest } from '@chainlink/types'
import { server as startServer } from '../../src'
import http from 'http'
import request, { SuperTest, Test } from 'supertest'
import { AddressInfo } from 'net'
import { Server } from 'mock-socket'
import { mockLoginResponse, mockSubscribeResponse, mockUnsubscribeResponse } from './fixtures'
import {
  mockWebSocketFlow,
  mockWebSocketProvider,
  mockWebSocketServer,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/ws/recorder'

let oldEnv: NodeJS.ProcessEnv

jest.setTimeout(20000)

describe('price-beth', () => {
  let mockedWsServer: Server
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    mockedWsServer = mockWebSocketServer('wss://feed.newchangefx.com/cryptodata')
    mockWebSocketProvider(WebSocketClassProvider)

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_USERNAME = 'user'
    process.env.API_PASSWORD = 'pass'
    process.env.WS_ENABLED = 'true'
    process.env.WS_SUBSCRIPTION_TTL = '100'

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

      const flowFulfilled = mockWebSocketFlow(mockedWsServer, [
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

      expect(response.body).toEqual({
        jobRunID: '1',
        result: 3106.9885,
        maxAge: 30000,
        statusCode: 200,
        data: { result: 3106.9885 },
      })

      await flowFulfilled
    })
  })
})
