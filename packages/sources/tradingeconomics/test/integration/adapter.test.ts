import { AdapterRequest, FastifyInstance, util } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import { mockResponseSuccess, mockSubscribeRequest, mockUnsubscribeRequest } from './fixtures'
import { AddressInfo } from 'net'
import {
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
  mockWebSocketFlow,
  setEnvVariables,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'
import { DEFAULT_WS_API_ENDPOINT } from '../../src/config'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'
import type { SuiteContext } from '@chainlink/ea-test-helpers'

describe('execute', () => {
  const id = '1'
  const context: SuiteContext = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    API_CLIENT_KEY: process.env.API_CLIENT_KEY || 'fake-api-key',
    API_CLIENT_SECRET: process.env.API_CLIENT_SECRET || 'fake-api-secret',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('symbol api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'price',
        base: 'EURUSD:CUR',
      },
    }

    it('should return success', async () => {
      mockResponseSuccess()

      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})

fdescribe('websocket', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  let oldEnv: NodeJS.ProcessEnv
  beforeAll(async () => {
    if (!process.env.RECORD) {
      process.env.API_CLIENT_KEY = process.env.API_CLIENT_KEY || 'fake-api-key'
      process.env.API_CLIENT_SECRET = process.env.API_CLIENT_SECRET || 'fake-api-secret'
      mockedWsServer = mockWebSocketServer(DEFAULT_WS_API_ENDPOINT)
      mockWebSocketProvider(WebSocketClassProvider)
    }

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'
    process.env.WS_SUBSCRIPTION_TTL = '2000'

    fastify = await startServer()
    req = request(`localhost:${(fastify.server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    setEnvVariables(oldEnv)
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    fastify.close(done)
  })

  describe('price with `includes` override', () => {
    const jobID = '1'

    fit('should return success', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          endpoint: 'price',
          base: 'CAD',
          quote: 'USD',
        },
      }

      let flowFulfilled = Promise.resolve(true)
      if (!process.env.RECORD) {
        mockResponseSuccess() // For the first response

        flowFulfilled = mockWebSocketFlow(mockedWsServer, [
          mockSubscribeRequest,
          mockUnsubscribeRequest,
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
      await util.sleep(1000)
      const response = await makeRequest()

      expect(response.body).toEqual({
        jobRunID: '1',
        result: 0.776530152665828,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 0.776530152665828 },
      })

      await flowFulfilled
    }, 30000)
  })
})
