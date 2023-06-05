import request, { SuperTest, Test } from 'supertest'
import {
  createAdapter,
  mockWebSocketProvider,
  mockStockWebSocketServer,
  setEnvVariables,
  setupExternalAdapterTest,
  SuiteContext,
  mockForexWebSocketServer,
  mockCryptoWebSocketServer,
  mockEtfWebSocketServer,
} from './setup'
import { AddressInfo } from 'net'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { mockResponseSuccess } from './fixtures'
import process from 'process'
import { Server } from 'mock-socket'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'
import { sleep } from '@chainlink/external-adapter-framework/util'

describe('execute', () => {
  describe('http', () => {
    let spy: jest.SpyInstance
    beforeAll(async () => {
      const mockDate = new Date('2022-01-01T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
    })

    afterAll((done) => {
      spy.mockRestore()
      done()
    })

    const id = '1'

    const context: SuiteContext = {
      req: null,
      server: async () => {
        process.env['RATE_LIMIT_CAPACITY_SECOND'] = '5000'
        process.env['METRICS_ENABLED'] = 'false'
        const server = (await import('../../src')).server
        return server() as Promise<ServerInstance>
      },
    }

    async function getResponse(data) {
      const response = await (context.req as SuperTest<Test>)
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)

      return response
    }

    const envVariables = {
      API_KEY: process.env.API_KEY || 'fake-api-key',
      WS_SOCKET_KEY: process.env.WS_API_KEY || 'fake-api-key',
    }

    setupExternalAdapterTest(envVariables, context)

    describe('crypto endpoint', () => {
      const data = {
        id,
        data: {
          endpoint: 'crypto',
          base: 'btc',
          quote: 'usd',
        },
      }

      it('should return success', async () => {
        mockResponseSuccess()

        const response = await getResponse(data)
        expect(response.body).toMatchSnapshot()
      })
    })

    describe('stock endpoint', () => {
      const data = {
        id,
        data: {
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

    describe('forex endpoint', () => {
      const data = {
        id,
        data: {
          endpoint: 'forex',
          base: 'gbp',
          quote: 'usd',
        },
      }

      it('should return success', async () => {
        mockResponseSuccess()

        const response = await getResponse(data)
        expect(response.body).toMatchSnapshot()
      })
    })

    describe('eod endpoint', () => {
      const data = {
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

    describe('commodities endpoint', () => {
      const data = {
        id,
        data: {
          endpoint: 'commodities',
          base: 'wti',
          quote: 'usd',
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

    describe('etf endpoint', () => {
      const data = {
        id,
        data: {
          endpoint: 'uk_etf',
          base: 'cspx',
        },
      }

      it('should return success', async () => {
        mockResponseSuccess()

        const response = await getResponse(data)
        expect(response.body).toMatchSnapshot()
      })
    })
  })

  describe('websocket', () => {
    describe('stock endpoint', () => {
      let fastify: ServerInstance | undefined
      let req: SuperTest<Test>
      let mockWsServer: Server | undefined
      let spy: jest.SpyInstance
      const wsEndpoint = 'ws://localhost:9090'

      jest.setTimeout(100000)

      const data = {
        data: {
          base: 'AAPL',
          transport: 'ws',
        },
      }

      let oldEnv: NodeJS.ProcessEnv
      beforeAll(async () => {
        oldEnv = JSON.parse(JSON.stringify(process.env))
        process.env['WS_SUBSCRIPTION_TTL'] = '10000'
        process.env['CACHE_MAX_AGE'] = '10000'
        process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
        process.env['METRICS_ENABLED'] = 'false'
        process.env['WS_ENABLED'] = 'true'
        process.env['WS_SOCKET_KEY'] = 'fake-api-key'
        process.env['STOCK_WS_API_ENDPOINT'] = wsEndpoint
        process.env['API_KEY'] = 'fake-api-key'
        const mockDate = new Date('2022-11-11T11:11:11.111Z')
        spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

        mockWebSocketProvider(WebSocketClassProvider)
        mockWsServer = mockStockWebSocketServer(wsEndpoint)

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

    describe('forex endpoint', () => {
      let fastify: ServerInstance | undefined
      let req: SuperTest<Test>
      let mockWsServer: Server | undefined
      let spy: jest.SpyInstance
      const wsEndpoint = 'ws://localhost:9090'

      jest.setTimeout(100000)

      const data = {
        data: {
          endpoint: 'forex',
          base: 'GBP',
          quote: 'USD',
          transport: 'ws',
        },
      }

      let oldEnv: NodeJS.ProcessEnv
      beforeAll(async () => {
        oldEnv = JSON.parse(JSON.stringify(process.env))
        process.env['WS_SUBSCRIPTION_TTL'] = '10000'
        process.env['CACHE_MAX_AGE'] = '10000'
        process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
        process.env['METRICS_ENABLED'] = 'false'
        process.env['WS_ENABLED'] = 'true'
        process.env['WS_SOCKET_KEY'] = 'fake-api-key'
        process.env['FOREX_WS_API_ENDPOINT'] = wsEndpoint
        process.env['API_KEY'] = 'fake-api-key'
        const mockDate = new Date('2022-11-11T11:11:11.111Z')
        spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

        mockWebSocketProvider(WebSocketClassProvider)
        mockWsServer = mockForexWebSocketServer(wsEndpoint)

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

    describe('crypto endpoint', () => {
      let fastify: ServerInstance | undefined
      let req: SuperTest<Test>
      let mockWsServer: Server | undefined
      let spy: jest.SpyInstance
      const wsEndpoint = 'ws://localhost:9090'

      jest.setTimeout(100000)

      const data = {
        data: {
          endpoint: 'crypto',
          base: 'BTC',
          quote: 'USD',
          transport: 'ws',
        },
      }

      let oldEnv: NodeJS.ProcessEnv
      beforeAll(async () => {
        oldEnv = JSON.parse(JSON.stringify(process.env))
        process.env['WS_SUBSCRIPTION_TTL'] = '10000'
        process.env['CACHE_MAX_AGE'] = '10000'
        process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
        process.env['METRICS_ENABLED'] = 'false'
        process.env['WS_ENABLED'] = 'true'
        process.env['WS_SOCKET_KEY'] = 'fake-api-key'
        process.env['CRYPTO_WS_API_ENDPOINT'] = wsEndpoint
        process.env['API_KEY'] = 'fake-api-key'
        const mockDate = new Date('2022-11-11T11:11:11.111Z')
        spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

        mockWebSocketProvider(WebSocketClassProvider)
        mockWsServer = mockCryptoWebSocketServer(wsEndpoint)

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
  })

  describe('etf endpoint', () => {
    let fastify: ServerInstance | undefined
    let req: SuperTest<Test>
    let mockWsServer: Server | undefined
    let spy: jest.SpyInstance
    const wsEndpoint = 'ws://localhost:9001'

    jest.setTimeout(100000)

    const data = {
      data: {
        endpoint: 'uk_etf',
        base: 'CSPX',
        transport: 'ws',
      },
    }

    let oldEnv: NodeJS.ProcessEnv
    beforeAll(async () => {
      oldEnv = JSON.parse(JSON.stringify(process.env))
      process.env['WS_SUBSCRIPTION_TTL'] = '10000'
      process.env['CACHE_MAX_AGE'] = '10000'
      process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
      process.env['METRICS_ENABLED'] = 'false'
      process.env['WS_ENABLED'] = 'true'
      process.env['WS_SOCKET_KEY'] = 'fake-api-key'
      process.env['ETF_WS_API_ENDPOINT'] = wsEndpoint
      process.env['API_KEY'] = 'fake-api-key'
      const mockDate = new Date('2022-11-11T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      mockWebSocketProvider(WebSocketClassProvider)
      mockWsServer = mockEtfWebSocketServer(wsEndpoint)

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
})
