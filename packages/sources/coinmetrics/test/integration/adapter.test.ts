import process from 'process'
import nock from 'nock'
import { server as startServer } from '../../src'
import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import { AddressInfo } from 'net'
import request, { SuperTest, Test } from 'supertest'
import { burnedTests } from './burned'
import { totalBurnedTests } from './total-burned'
import {
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
  mockWebSocketFlow,
  setEnvVariables,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'
import { DEFAULT_WS_API_ENDPOINT } from '../../src/config'
import {
  mockCoinmetricsResponseSuccess4,
  mockSubscribeResponse,
  mockUnsubscribeResponse,
} from './fixtures'
import { util } from '@chainlink/ea-bootstrap'

let oldEnv: NodeJS.ProcessEnv

export interface SuiteContext {
  fastify: FastifyInstance | null
  req: SuperTest<Test> | null
}

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.API_KEY = 'test_api_key'
  process.env.API_VERBOSE = 'true'
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  setEnvVariables(oldEnv)
  if (process.env.RECORD) {
    nock.recorder.play()
  }

  nock.restore()
  nock.cleanAll()
})

describe('execute', () => {
  const context: SuiteContext = {
    fastify: null,
    req: null,
  }

  beforeEach(async () => {
    context.fastify = await startServer()
    context.req = request(`localhost:${(context.fastify.server.address() as AddressInfo).port}`)
  })

  afterEach((done) => {
    ;(context.fastify as FastifyInstance).close(done)
  })

  describe('total-burned endpoint', () => totalBurnedTests(context))
  describe('burned endpoint', () => burnedTests(context))
})

describe('websocket', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  let oldEnv: NodeJS.ProcessEnv
  beforeAll(async () => {
    if (!process.env.RECORD) {
      mockedWsServer = mockWebSocketServer(
        `${DEFAULT_WS_API_ENDPOINT}/timeseries-stream/asset-metrics?assets=eth&metrics=ReferenceRateUSD&frequency=1s&api_key=${process.env.API_KEY}`,
      )
      mockWebSocketProvider(WebSocketClassProvider)
    }

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'
    process.env.WS_SUBSCRIPTION_TTL = '1000'

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
          base: 'ETH',
          quote: 'USD',
        },
      }

      let flowFulfilled = Promise.resolve(true)
      if (!process.env.RECORD) {
        mockCoinmetricsResponseSuccess4() // For the first response

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

      // We don't care about the first response, coming from http request
      // This first request will start both batch warmer & websocket
      await makeRequest()

      // This final request should disable the cache warmer, sleep is used to make sure that the data is  pulled from the websocket
      // populated cache entries.
      await util.sleep(500)
      const response = await makeRequest()

      expect(response.body).toEqual({
        jobRunID: '1',
        result: 2971.13,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 2971.13 },
      })

      await flowFulfilled
    }, 30000)
  })
})
