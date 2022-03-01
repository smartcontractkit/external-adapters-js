import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import {
  mockResponseSuccess,
  mockResponseFailure,
  mockCryptoSubscribeResponse,
  mockCryptoUnsubscribeResponse,
} from './fixtures'
import { AddressInfo } from 'net'
import {
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
  mockWebSocketFlow,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'

const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    process.env.API_KEY = process.env.API_KEY || 'fake-api-key'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('stock api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'stock',
        base: 'ETH',
      },
    }

    it('should return success', async () => {
      mockResponseSuccess()

      const response = await req
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

      const response = await req
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

      const response = await req
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

      const response = await req
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

      const response = await req
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
  let server: http.Server
  let req: SuperTest<Test>

  let oldEnv: NodeJS.ProcessEnv

  afterAll((done) => {
    process.env = oldEnv
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('crypto endpoint', () => {
    beforeAll(async () => {
      if (!process.env.RECORD) {
        process.env.API_KEY = process.env.API_KEY || 'fake-api-key'
        process.env.WS_SOCKET_KEY = process.env.WS_SOCKET_KEY || 'fake-api-key'
        process.env.CRYPTO_WS_API_ENDPOINT =
          process.env.CRYPTO_WS_API_ENDPOINT || 'wss://localhost:8000'

        mockedWsServer = mockWebSocketServer(process.env.CRYPTO_WS_API_ENDPOINT)
        mockWebSocketProvider(WebSocketClassProvider)
      }

      oldEnv = JSON.parse(JSON.stringify(process.env))
      process.env.WS_ENABLED = 'true'
      process.env.WS_SUBSCRIPTION_TTL = '100'

      server = await startServer()
      req = request(`localhost:${(server.address() as AddressInfo).port}`)
    })
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

      let flowFulfilled: Promise<boolean>
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
