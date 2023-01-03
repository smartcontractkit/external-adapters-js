import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { Server } from 'mock-socket'
import { AddressInfo } from 'net'
import request, { SuperTest, Test } from 'supertest'
import { mockResponseSuccess } from './fixtures'
import {
  createAdapter,
  mockWebSocketProvider,
  mockWebSocketServer,
  setEnvVariables,
  setupExternalAdapterTest,
  SuiteContext,
} from './setup'
import { AdapterRequestBody, sleep } from '@chainlink/external-adapter-framework/util'
import { WebSocketClassProvider } from '@chainlink/external-adapter-framework/transports'

describe('execute', () => {
  describe('price endpoint rest', () => {
    const context: SuiteContext = {
      req: null,
      server: async () => {
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
    const data = {
      id,
      data: {
        base: 'EURUSD',
        quote: 'CUR',
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

      expect(response.body).toMatchSnapshot({
        timestamps: {
          providerDataReceived: expect.any(Number),
          providerDataRequested: expect.any(Number),
        },
      })
    })
  })

  describe('price endpoint websocket', () => {
    let fastify: ServerInstance | undefined
    let req: SuperTest<Test>
    let mockWsServer: Server | undefined
    let spy: jest.SpyInstance

    jest.setTimeout(100000)

    const data: AdapterRequestBody = {
      data: {
        endpoint: 'price',
        base: 'CAD',
        quote: 'USD',
      },
    }

    let oldEnv: NodeJS.ProcessEnv
    const wsEndpoint = 'wss://stream.tradingeconomics.com/'

    beforeAll(async () => {
      oldEnv = JSON.parse(JSON.stringify(process.env))
      process.env['WS_SUBSCRIPTION_TTL'] = '5000'
      process.env['CACHE_MAX_AGE'] = '5000'
      process.env['CACHE_POLLING_MAX_RETRIES'] = '0'
      process.env['METRICS_ENABLED'] = 'false'
      process.env['WS_ENABLED'] = 'true'
      process.env['API_KEY'] = 'fake-api-key'
      process.env['API_CLIENT_KEY'] = 'fake-api-key'
      process.env['API_CLIENT_SECRET'] = 'fake-api-secret'

      const mockDate = new Date('2022-11-11T11:11:11.111Z')
      spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

      mockResponseSuccess()
      mockWebSocketProvider(WebSocketClassProvider)
      mockWsServer = mockWebSocketServer(wsEndpoint)

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

      const response = await makeRequest()
      expect(response.body).toMatchSnapshot()
    }, 30000)
  })
})
