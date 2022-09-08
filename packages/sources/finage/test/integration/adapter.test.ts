import { AdapterRequest, FastifyInstance } from '@chainlink/ea-bootstrap'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import { util } from '@chainlink/ea-bootstrap'
import {
  mockResponseSuccess,
  mockResponseFailure,
  mockCryptoSubscribeResponse,
  mockCryptoUnsubscribeResponse,
  mockStockSubscribeResponse,
  mockStockUnsubscribeResponse,
  mockForexSubscribeResponse,
  mockForexUnsubscribeResponse,
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
import {
  DEFAULT_CRYPTO_WS_API_ENDPOINT,
  DEFAULT_FOREX_WS_API_ENDPOINT,
  DEFAULT_STOCK_WS_API_ENDPOINT,
} from '../../src/config'
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
    WS_SOCKET_KEY: process.env.WS_SOCKET_KEY || 'test_socket_key',
  }

  setupExternalAdapterTest(envVariables, context)

  describe('stock api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'stock',
        base: 'AAPL',
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

  describe('eod api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'eod',
        base: 'ETH',
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

  describe('stock api with invalid base', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'stock',
        base: 'non-existing',
      },
    }

    it('should return failure', async () => {
      mockResponseFailure()

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

  describe('forex api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'forex',
        from: 'GBP',
        to: 'USD',
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

  describe('crypto api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'crypto',
        from: 'BTC',
        to: 'USD',
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

  describe('commodities api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'commodities',
        from: 'WTI',
        to: 'USD',
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

  describe('commodities api with invalid base', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'commodities',
        from: 'nonexisting',
        to: 'USD',
      },
    }

    it('should return failure', async () => {
      mockResponseFailure()

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
      process.env.WS_SOCKET_KEY = process.env.WS_SOCKET_KEY || 'fake-api-key'
      process.env.STOCK_WS_API_ENDPOINT =
        process.env.STOCK_WS_API_ENDPOINT || DEFAULT_STOCK_WS_API_ENDPOINT

      mockedWsServer = mockWebSocketServer(process.env.STOCK_WS_API_ENDPOINT)
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

  describe('stock endpoint', () => {
    const jobID = '1'

    it('should return success', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          endpoint: 'stock',
          base: 'AAPL',
        },
      }

      let flowFulfilled = Promise.resolve(true)
      if (!process.env.RECORD) {
        mockResponseSuccess() // For the first response

        flowFulfilled = mockWebSocketFlow(mockedWsServer, [
          mockStockSubscribeResponse,
          mockStockUnsubscribeResponse,
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

      // This final request should disable the cache warmer, sleep is used to make sure that the data is  pulled from the websocket populated cache entries.
      await util.sleep(100)
      const response = await makeRequest()

      expect(response.body).toEqual({
        jobRunID: '1',
        result: 163.58,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 163.58 },
      })

      await flowFulfilled
    }, 30000)
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
      process.env.WS_SOCKET_KEY = process.env.WS_SOCKET_KEY || 'fake-api-key'
      process.env.ENV_FOREX_WS_API_ENDPOINT =
        process.env.ENV_FOREX_WS_API_ENDPOINT || DEFAULT_FOREX_WS_API_ENDPOINT

      mockedWsServer = mockWebSocketServer(process.env.ENV_FOREX_WS_API_ENDPOINT)
      mockWebSocketProvider(WebSocketClassProvider)
    }

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'
    process.env.WS_SUBSCRIPTION_TTL = '100'

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

  describe('forex endpoint', () => {
    const jobID = '1'

    it('should return success', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          endpoint: 'forex',
          base: 'GBP',
          quote: 'USD',
        },
      }

      let flowFulfilled = Promise.resolve(true)
      if (!process.env.RECORD) {
        mockResponseSuccess() // For the first response

        flowFulfilled = mockWebSocketFlow(mockedWsServer, [
          mockForexSubscribeResponse,
          mockForexUnsubscribeResponse,
          // Double mocks in flow are needed to get rid of timing issues
          mockForexSubscribeResponse,
          mockForexUnsubscribeResponse,
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

      // This final request should disable the cache warmer, sleep is used to make sure that the data is pulled from the websocket populated cache entries.
      await util.sleep(100)
      const response = await makeRequest()

      expect(response.body).toEqual({
        jobRunID: '1',
        result: 1.331345,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 1.331345 },
      })

      await flowFulfilled
    }, 30000)
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
      process.env.WS_SOCKET_KEY = 'fake-api-key'
      process.env.CRYPTO_WS_API_ENDPOINT = DEFAULT_CRYPTO_WS_API_ENDPOINT

      mockedWsServer = mockWebSocketServer(process.env.CRYPTO_WS_API_ENDPOINT)
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

  describe('crypto endpoint', () => {
    const jobID = '1'

    it('should return success', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          endpoint: 'crypto',
          base: 'BTC',
          quote: 'USD',
        },
      }

      let flowFulfilled = Promise.resolve(true)
      if (!process.env.RECORD) {
        mockResponseSuccess() // For the first response

        flowFulfilled = mockWebSocketFlow(mockedWsServer, [
          mockCryptoSubscribeResponse,
          mockCryptoUnsubscribeResponse,
          // Double mocks in flow are needed to get rid of timing issues
          mockCryptoSubscribeResponse,
          mockCryptoUnsubscribeResponse,
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

      await util.sleep(100)
      // This final request should disable the cache warmer
      const response = await makeRequest()
      expect(response.body).toEqual({
        jobRunID: '1',
        result: 43682.66306523,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 43682.66306523 },
      })

      await flowFulfilled
    }, 30000)
  })
})
