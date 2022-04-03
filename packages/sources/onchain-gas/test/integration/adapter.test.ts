import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as http from 'http'
import { AddressInfo } from 'net'
import { mockGetBlockByNumber, mockWSResponse } from './fixtures'
import {
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
  mockWebSocketFlow,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'

describe('websocket', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  let server: http.Server
  let req: SuperTest<Test>

  let oldEnv: NodeJS.ProcessEnv
  beforeAll(async () => {
    if (!process.env.RECORD) {
      process.env.ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || 'http://localhost:8545'
      process.env.ETHEREUM_WS_RPC_URL = process.env.ETHEREUM_WS_RPC_URL || 'wss://localhost:8000'
      mockedWsServer = mockWebSocketServer(process.env.ETHEREUM_WS_RPC_URL)
      mockWebSocketProvider(WebSocketClassProvider)
    }

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'
    process.env.WS_SUBSCRIPTION_TTL = '100'

    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    process.env = oldEnv
    server.close(done)
  })

  describe('gas endpoint', () => {
    const jobID = '1'

    it('should return success', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          numBlocks: 1,
        },
      }

      let flowFulfilled: Promise<boolean>
      if (!process.env.RECORD) {
        mockGetBlockByNumber()
        flowFulfilled = mockWebSocketFlow(mockedWsServer, [mockWSResponse])
      }

      const makeRequest = () =>
        req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

      const response = await makeRequest()

      expect(response.body).toEqual({
        jobRunID: '1',
        result: 89435338670,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 89435338670 },
      })

      await flowFulfilled
    }, 30000)
  })
})
