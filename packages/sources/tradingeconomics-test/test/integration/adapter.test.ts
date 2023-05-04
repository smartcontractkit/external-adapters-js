import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Server } from 'mock-socket'
import { AddressInfo } from 'net'
import request, { SuperTest, Test } from 'supertest'
import { mockResponseSuccess } from './fixtures'
import {
  createAdapter,
  mockStockWebSocketServer,
  mockWebSocketProvider,
  mockWebSocketServer,
  setEnvVariables,
  setupExternalAdapterTest,
  SuiteContext,
} from './setup'
import { sleep } from '@chainlink/external-adapter-framework/util'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'

describe('execute', () => {
  let spy: jest.SpyInstance
  beforeAll(async () => {
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
  })

  afterAll((done) => {
    spy.mockRestore()
    done()
  })

  const context: SuiteContext = {
    req: null,
    server: async () => {
      process.env['RATE_LIMIT_CAPACITY_SECOND'] = '5000'
      process.env['CACHE_POLLING_MAX_RETRIES'] = '20'
      process.env['CACHE_POLLING_SLEEP_MS'] = '500'
      process.env['METRICS_ENABLED'] = 'false'
      process.env['BACKGROUND_EXECUTE_MS_HTTP'] = '50'
      const server = (await import('../../src')).server
      return server() as Promise<ServerInstance>
    },
  }

  const envVariables = {
    API_CLIENT_KEY: process.env.API_CLIENT_KEY || 'fake-api-key',
    API_CLIENT_SECRET: process.env.API_CLIENT_SECRET || 'fake-api-secret',
  }

  setupExternalAdapterTest(envVariables, context)

  const id = '1'
  describe('rest price endpoint', () => {
    const data = {
      id,
      data: {
        base: 'EUR',
        quote: 'USD',
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

  describe('rest price endpoint with override', () => {
    const data = {
      id,
      data: {
        base: 'EUR',
        quote: 'XXX',
        overrides: {
          tradingeconomics: {
            EUR: 'EURUSD:CUR',
          },
        },
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

  describe('rest stock endpoint', () => {
    const data = {
      id,
      data: {
        base: 'AAPL:US',
        endpoint: 'stock',
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

  describe('websocket price endpoint', () => {
    let fastify: ServerInstance | undefined
    let req: SuperTest<Test>
    let mockWsServer: Server | undefined
    let spy: jest.SpyInstance

    jest.setTimeout(10_000)

    const id = '1'
    const data = {
      id,
      data: {
        base: 'CAD',
        quote: 'USD',
        transport: 'ws',
      },
    }

    let oldEnv: NodeJS.ProcessEnv

    beforeAll(async () => {
      oldEnv = JSON.parse(JSON.stringify(process.env))
      process.env['WS_SUBSCRIPTION_TTL'] = '5000'
      process.env['CACHE_MAX_AGE'] = '5000'
      process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
      process.env['METRICS_ENABLED'] = 'false'
      process.env['API_CLIENT_KEY'] = 'fake-api-key'
      process.env['WS_ENABLED'] = 'true'
      process.env['API_CLIENT_SECRET'] = 'fake-api-secret'

      const wsEndpoint = 'wss://stream.tradingeconomics.com/?client=fake-api-key:fake-api-secret'

      mockWebSocketProvider(WebSocketClassProvider)
      mockWsServer = mockWebSocketServer(wsEndpoint)

      const mockDate = new Date('2022-11-11T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      fastify = await expose(createAdapter())
      req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

      // Send initial request to start background execute
      await req.post('/').send(data)
      await sleep(5000)
    })

    afterAll((done) => {
      spy.mockRestore()
      setEnvVariables(oldEnv)
      mockWsServer?.close()
      fastify?.close(done())
    })

    it('should return success', async () => {
      const makeRequest = () =>
        req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

      const response = await makeRequest()
      expect(response.body).toMatchSnapshot()
    }, 30000)
  })

  describe('websocket stock endpoint', () => {
    let fastify: ServerInstance | undefined
    let req: SuperTest<Test>
    let mockWsServer: Server | undefined
    let spy: jest.SpyInstance

    jest.setTimeout(10_000)

    const id = '1'
    const data = {
      id,
      data: {
        base: 'AAPL:US',
        endpoint: 'stock',
        transport: 'ws',
      },
    }

    let oldEnv: NodeJS.ProcessEnv

    beforeAll(async () => {
      oldEnv = JSON.parse(JSON.stringify(process.env))
      process.env['WS_SUBSCRIPTION_TTL'] = '5000'
      process.env['CACHE_MAX_AGE'] = '5000'
      process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
      process.env['METRICS_ENABLED'] = 'false'
      process.env['API_CLIENT_KEY'] = 'fake-api-key'
      process.env['WS_ENABLED'] = 'true'
      process.env['API_CLIENT_SECRET'] = 'fake-api-secret'

      const wsEndpoint = 'wss://stream.tradingeconomics.com/?client=fake-api-key:fake-api-secret'

      mockWebSocketProvider(WebSocketClassProvider)
      mockWsServer = mockStockWebSocketServer(wsEndpoint)

      const mockDate = new Date('2022-11-11T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      fastify = await expose(createAdapter())
      req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

      // Send initial request to start background execute
      await req.post('/').send(data)
      await sleep(5000)
    })

    afterAll((done) => {
      spy.mockRestore()
      setEnvVariables(oldEnv)
      mockWsServer?.close()
      fastify?.close(done())
    })

    it('should return success', async () => {
      const makeRequest = () =>
        req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
      // .expect(200)

      const response = await makeRequest()
      expect(response.body).toMatchSnapshot()
    }, 30000)
  })
})
