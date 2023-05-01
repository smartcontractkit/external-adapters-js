import request, { SuperTest, Test } from 'supertest'
import {
  createAdapter,
  mockCryptoLwbaWebSocketServer,
  mockCryptoWebSocketServer,
  mockForexWebSocketServer,
  mockIexWebSocketServer,
  mockWebSocketProvider,
  setEnvVariables,
  setupExternalAdapterTest,
  SuiteContext,
} from './setup'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { mockResponseSuccess } from './fixtures'
import process from 'process'
import { Server } from 'mock-socket'
import { AddressInfo } from 'net'
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

    const context: SuiteContext = {
      req: null,
      server: async () => {
        // workaround for failing integration tests that run in parallel
        process.env['RATE_LIMIT_CAPACITY_SECOND'] = '10000'
        process.env['METRICS_ENABLED'] = 'false'
        const server = (await import('../../src')).server
        return server() as Promise<ServerInstance>
      },
    }

    const envVariables = {
      API_KEY: process.env.API_KEY || 'fake-api-key',
    }

    setupExternalAdapterTest(envVariables, context)

    describe('cryptoyield endpoint', () => {
      const data = {
        data: {
          endpoint: 'cryptoyield',
          aprTerm: '90day',
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

    describe('crypto endpoint', () => {
      const data = {
        data: {
          base: 'ETH',
          quote: 'USD',
          transport: 'rest',
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

    describe('eod endpoint', () => {
      const data = {
        data: {
          endpoint: 'eod',
          ticker: 'USD',
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

    describe('top endpoint', () => {
      const data = {
        data: {
          endpoint: 'top',
          base: 'ETH',
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

    describe('volume endpoint', () => {
      const data = {
        data: {
          endpoint: 'volume',
          base: 'ETH',
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

    describe('vwap endpoint', () => {
      const data = {
        data: {
          endpoint: 'vwap',
          base: 'ampl',
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

    describe('forex endpoint', () => {
      const data = {
        data: {
          endpoint: 'forex',
          base: 'gbp',
          quote: 'usd',
          transport: 'rest',
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

    describe('iex endpoint', () => {
      const data = {
        data: {
          endpoint: 'iex',
          ticker: 'aapl',
          transport: 'rest',
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

    describe('realized-vol endpoint', () => {
      const data = {
        data: {
          base: 'ETH',
          endpoint: 'realized-vol',
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

  describe('websocket crypto endpoint', () => {
    let fastify: ServerInstance | undefined
    let req: SuperTest<Test>
    let mockWsServer: Server | undefined
    let spy: jest.SpyInstance
    const wsEndpoint = 'ws://localhost:9090'

    jest.setTimeout(100000)

    const priceData = {
      data: {
        base: 'eth',
        quote: 'usd',
      },
    }

    let oldEnv: NodeJS.ProcessEnv
    beforeAll(async () => {
      oldEnv = JSON.parse(JSON.stringify(process.env))
      process.env['WS_SUBSCRIPTION_TTL'] = '20000'
      process.env['CACHE_MAX_AGE'] = '20000'
      process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
      process.env['METRICS_ENABLED'] = 'false'
      process.env['WS_API_ENDPOINT'] = wsEndpoint
      process.env['API_KEY'] = 'fake-api-key'
      const mockDate = new Date('2022-11-11T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      mockWebSocketProvider(WebSocketClassProvider)
      mockWsServer = mockCryptoWebSocketServer(wsEndpoint + '/crypto-synth')

      fastify = await expose(createAdapter())
      req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

      // Send initial request to start background execute
      await req.post('/').send(priceData)
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
          .send(priceData)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

      const response = await makeRequest()
      expect(response.body).toMatchSnapshot()
    }, 30000)
  })

  describe('websocket crypto_lwba endpoint', () => {
    let fastify: ServerInstance | undefined
    let req: SuperTest<Test>
    let mockWsServer: Server | undefined
    let spy: jest.SpyInstance
    const wsEndpoint = 'ws://localhost:9090'

    jest.setTimeout(100000)

    const spreadData = {
      data: {
        endpoint: 'crypto_lwba',
        base: 'eth',
        quote: 'usd',
      },
    }

    let oldEnv: NodeJS.ProcessEnv
    beforeAll(async () => {
      oldEnv = JSON.parse(JSON.stringify(process.env))
      process.env['WS_SUBSCRIPTION_TTL'] = '20000'
      process.env['CACHE_MAX_AGE'] = '20000'
      process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
      process.env['METRICS_ENABLED'] = 'false'
      process.env['WS_API_ENDPOINT'] = wsEndpoint
      process.env['API_KEY'] = 'fake-api-key'
      const mockDate = new Date('2023-03-30T14:38:14.577256+00:00')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      mockWebSocketProvider(WebSocketClassProvider)
      mockWsServer = mockCryptoLwbaWebSocketServer(wsEndpoint + '/crypto-synth-top')

      fastify = await expose(createAdapter())
      req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

      // Send initial request to start background execute
      await req.post('/').send(spreadData)
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
          .send(spreadData)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

      const response = await makeRequest()
      expect(response.body).toMatchSnapshot()
    }, 30000)
  })

  describe('websocket iex endpoint', () => {
    let fastify: ServerInstance | undefined
    let req: SuperTest<Test>
    let mockWsServer: Server | undefined
    let spy: jest.SpyInstance
    const wsEndpoint = 'ws://localhost:9090'

    jest.setTimeout(100000)

    const priceDataAapl = {
      data: {
        endpoint: 'iex',
        base: 'aapl',
      },
    }

    const priceDataAmzn = {
      data: {
        endpoint: 'iex',
        base: 'amzn',
      },
    }

    let oldEnv: NodeJS.ProcessEnv
    beforeAll(async () => {
      oldEnv = JSON.parse(JSON.stringify(process.env))
      process.env['WS_SUBSCRIPTION_TTL'] = '10000'
      process.env['CACHE_MAX_AGE'] = '20000'
      process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
      process.env['METRICS_ENABLED'] = 'false'
      process.env['WS_API_ENDPOINT'] = wsEndpoint
      process.env['API_KEY'] = 'fake-api-key'
      const mockDate = new Date('2022-11-11T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      mockWebSocketProvider(WebSocketClassProvider)
      mockWsServer = mockIexWebSocketServer(wsEndpoint + '/iex')

      fastify = await expose(createAdapter())
      req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

      // Send initial request to start background execute
      await req.post('/').send(priceDataAapl)
      await req.post('/').send(priceDataAmzn)
      await sleep(5000)
    })

    afterAll((done) => {
      spy.mockRestore()
      setEnvVariables(oldEnv)
      mockWsServer?.close()
      fastify?.close(done())
    })

    it('Q request should return success', async () => {
      const makeRequest = () =>
        req
          .post('/')
          .send(priceDataAapl)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

      const response = await makeRequest()
      expect(response.body).toMatchSnapshot()
    }, 30000)

    it('T request should return success', async () => {
      const makeRequest = () =>
        req
          .post('/')
          .send(priceDataAmzn)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

      const response = await makeRequest()
      expect(response.body).toMatchSnapshot()
    }, 30000)
  })

  describe('websocket forex endpoint', () => {
    let fastify: ServerInstance | undefined
    let req: SuperTest<Test>
    let mockWsServer: Server | undefined
    let spy: jest.SpyInstance
    const wsEndpoint = 'ws://localhost:9090'

    jest.setTimeout(100000)

    const priceData = {
      data: {
        endpoint: 'forex',
        base: 'eur',
        quote: 'usd',
      },
    }

    let oldEnv: NodeJS.ProcessEnv
    beforeAll(async () => {
      oldEnv = JSON.parse(JSON.stringify(process.env))
      process.env['WS_SUBSCRIPTION_TTL'] = '10000'
      process.env['CACHE_MAX_AGE'] = '20000'
      process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
      process.env['METRICS_ENABLED'] = 'false'
      process.env['WS_API_ENDPOINT'] = wsEndpoint
      process.env['API_KEY'] = 'fake-api-key'
      const mockDate = new Date('2022-11-11T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      mockWebSocketProvider(WebSocketClassProvider)
      mockWsServer = mockForexWebSocketServer(wsEndpoint + '/fx')

      fastify = await expose(createAdapter())
      req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)

      // Send initial request to start background execute
      await req.post('/').send(priceData)
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
          .send(priceData)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)

      const response = await makeRequest()
      expect(response.body).toMatchSnapshot()
    }, 30000)
  })
})
