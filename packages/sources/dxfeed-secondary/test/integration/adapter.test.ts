import { AdapterRequest, FastifyInstance, util } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import { AddressInfo } from 'net'
import {
  mockFirstHeartbeatMsg,
  mockHandshake,
  mockHeartbeatMsg,
  mockPriceResponse,
  mockSubscribe,
  mockUnsubscribe,
} from './fixtures'
import {
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
  mockWebSocketFlow,
  setEnvVariables,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'
import { setupExternalAdapterTest } from '@chainlink/ea-test-helpers'

describe('dxfeed secondary', () => {
  const id = '1'
  const context = {
    req: null,
    server: startServer,
  }

  const envVariables = {
    API_USERNAME: process.env.API_USERNAME || 'fake-api-username',
    API_PASSWORD: process.env.API_PASSWORD || 'fake-api-password',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('price endpoint', () => {
    const priceRequest: AdapterRequest = {
      id,
      data: {
        base: 'FTSE',
      },
    }

    it('should return success', async () => {
      mockPriceResponse()

      const response = await context.req
        .post('/')
        .send(priceRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})

describe('websocket', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  let oldEnv: NodeJS.ProcessEnv
  beforeAll(async () => {
    if (!process.env.RECORD) {
      process.env.API_USERNAME = 'fake-api-username'
      process.env.API_PASSWORD = 'fake-api-password'
      process.env.WS_API_ENDPOINT = 'wss://localhost:8080'
      mockedWsServer = mockWebSocketServer(process.env.WS_API_ENDPOINT)
      mockWebSocketProvider(WebSocketClassProvider)
    }

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'
    process.env.WS_SUBSCRIPTION_TTL = '300'

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

  describe('price endpoint', () => {
    const jobID = '1'

    it('should return success', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          base: 'FTSE',
        },
      }

      let flowFulfilled: Promise<boolean>
      if (!process.env.RECORD) {
        mockPriceResponse() // For the first response

        flowFulfilled = mockWebSocketFlow(
          mockedWsServer,
          [mockHandshake, mockFirstHeartbeatMsg, mockHeartbeatMsg, mockSubscribe, mockUnsubscribe],
          {
            enforceSequence: false,
            errorOnUnexpectedMessage: false,
          },
        )
      }

      const makeRequest = () =>
        req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

      // We don't care about the first response, coming from http request
      // This first request will start both batch warmer & websocket
      await makeRequest()

      // This final request should disable the cache warmer, sleep is used to make sure that the data is  pulled from the websocket
      // populated cache entries.
      await util.sleep(100)
      const response = await makeRequest()

      expect(response.body).toEqual({
        jobRunID: '1',
        result: 788,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 788 },
      })

      await flowFulfilled
    }, 10000)
  })
})
