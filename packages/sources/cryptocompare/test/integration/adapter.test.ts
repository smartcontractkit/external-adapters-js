import { AdapterRequest, FastifyInstance, util } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import {
  mockPriceResponseFailure,
  mockPriceResponseSuccess,
  mockSubscribeResponse,
  mockUnsubscribeResponse,
} from './fixtures'
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
    API_KEY: process.env.API_KEY || 'fake-api-key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('price api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'ETH',
        quote: 'BTC',
      },
    }

    it('should return success', async () => {
      mockPriceResponseSuccess()

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

  describe('marketcap api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'ETH',
        quote: 'BTC',
        endpoint: 'marketcap',
      },
    }

    it('should return success', async () => {
      mockPriceResponseSuccess()

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

  describe('volume api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'ETH',
        quote: 'BTC',
        endpoint: 'volume',
      },
    }

    it('should return success', async () => {
      mockPriceResponseSuccess()

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

  describe('api with invalid token', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'ETH',
        quote: 'XXX',
      },
    }

    it('should return failure', async () => {
      mockPriceResponseFailure()

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

  describe('vwap api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'AMPL',
        quote: 'USD',
        endpoint: 'vwap',
      },
    }

    it('should return success', async () => {
      mockPriceResponseSuccess()

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

describe('websocket', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  let fastify: FastifyInstance
  let req: SuperTest<Test>

  let oldEnv: NodeJS.ProcessEnv
  beforeAll(async () => {
    if (!process.env.RECORD) {
      process.env.API_KEY = 'fake-api-key'
      mockedWsServer = mockWebSocketServer(
        `${DEFAULT_WS_API_ENDPOINT}?api_key=${process.env.API_KEY}`,
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

  describe('crypto endpoint', () => {
    const jobID = '1'

    it('should return success', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          base: 'ETH',
          quote: 'BTC',
        },
      }

      let flowFulfilled = Promise.resolve(true)
      if (!process.env.RECORD) {
        mockPriceResponseSuccess() // For the first response

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
        result: 0.07038,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 0.07038 },
      })

      await flowFulfilled
    }, 30000)
  })
})
