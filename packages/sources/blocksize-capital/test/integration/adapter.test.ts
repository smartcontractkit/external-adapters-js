import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import {
  mockResponse,
  mockLoginResponse,
  mockResponseSuccess,
  mockSubscribeResponse,
  mockUnsubscribeResponse,
} from './fixtures'
import { AddressInfo } from 'net'
import {
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
  mockWebSocketFlow,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'
import { DEFAULT_ENDPOINT } from '../../src/config'
import { util } from '@chainlink/ea-bootstrap'

describe('websocket', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  let server: http.Server
  let req: SuperTest<Test>

  let oldEnv: NodeJS.ProcessEnv
  beforeAll(async () => {
    if (!process.env.RECORD) {
      process.env.API_KEY = process.env.API_KEY || 'fake-api-key'
      mockedWsServer = mockWebSocketServer(DEFAULT_ENDPOINT)
      mockWebSocketProvider(WebSocketClassProvider)
    }

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'
    process.env.WS_SUBSCRIPTION_TTL = '1000'

    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    process.env = oldEnv
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('values endpoint', () => {
    const jobID = '1'

    it('should return success', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          index: 'BRTI',
        },
      }

      let flowFulfilled: Promise<boolean>
      if (!process.env.RECORD) {
        mockResponseSuccess() // For the first response

        flowFulfilled = mockWebSocketFlow(mockedWsServer, [
          mockSubscribeResponse,
          mockUnsubscribeResponse,
        ])
      }

      const makeRequest = () =>
        req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

      // This first request will start both batch warmer & websocket
      await makeRequest()

      // This final request should disable the cache warmer, sleep is used to make sure that the data is  pulled from the websocket
      // populated cache entries.
      await util.sleep(500)
      const response = await makeRequest()

      expect(response.body).toEqual({
        jobRunID: '1',
        result: 40067,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 40067 },
      })

      await flowFulfilled
    }, 30000)
  })
})
