import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import {
  mockCryptoSubscribeResponse,
  mockCryptoUnsubscribeResponse,
  mockIexSubscribeResponse,
  mockIexUnsubscribeResponse,
  mockResponseSuccess,
} from './fixtures'
import { AddressInfo } from 'net'
import {
  mockWebSocketProvider,
  mockWebSocketServer,
  MockWsServer,
  mockWebSocketFlow,
} from '@chainlink/ea-test-helpers'
import { WebSocketClassProvider } from '@chainlink/ea-bootstrap/dist/lib/middleware/ws/recorder'
import { DEFAULT_WS_API_ENDPOINT } from '../../src/config'
import { util } from '@chainlink/ea-bootstrap'

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

  describe('eod api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'eod',
        base: 'usd',
        field: 'close',
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

  describe('iex api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'iex',
        base: 'aapl',
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

  describe('prices api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'prices',
        base: 'ETH',
        quote: 'USD',
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

  describe('top api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'top',
        base: 'ETH',
        quote: 'USD',
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

  describe('volume api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'volume',
        base: 'ETH',
        quote: 'USD',
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

  describe('forex', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'forex',
        base: 'GBP',
        quote: 'USD',
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

  describe('commodities', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'commodities',
        base: 'USOIL',
        quote: 'USD',
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

  describe('crypto-vwap api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'crypto-vwap',
        base: 'AMPL',
        quote: 'USD',
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
  beforeAll(async () => {
    if (!process.env.RECORD) {
      process.env.API_KEY = 'fake-api-key'
      mockedWsServer = mockWebSocketServer(`${DEFAULT_WS_API_ENDPOINT}/crypto-synth`)
      mockWebSocketProvider(WebSocketClassProvider)
    }

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'
    process.env.WS_SUBSCRIPTION_TTL = '300'

    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    process.env = oldEnv
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('crypto endpoint', () => {
    const jobID = '1'

    it('should return success', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          endpoint: 'price',
          base: 'ETH',
          quote: 'USD',
        },
      }

      let flowFulfilled: Promise<boolean>
      if (!process.env.RECORD) {
        mockResponseSuccess() // For the first response

        flowFulfilled = mockWebSocketFlow(mockedWsServer, [
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

      // This final request should disable the cache warmer, sleep is used to make sure that the data is  pulled from the websocket
      // populated cache entries.
      await util.sleep(10)
      const response = await makeRequest()

      expect(response.body).toEqual({
        jobRunID: '1',
        result: 2930.4483973989,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 2930.4483973989 },
      })

      await flowFulfilled
    }, 30000)
  })
})

describe('websocket', () => {
  let mockedWsServer: InstanceType<typeof MockWsServer>
  let server: http.Server
  let req: SuperTest<Test>

  let oldEnv: NodeJS.ProcessEnv
  beforeAll(async () => {
    if (!process.env.RECORD) {
      process.env.API_KEY = 'fake-api-key'
      mockedWsServer = mockWebSocketServer(`${DEFAULT_WS_API_ENDPOINT}/iex`)
      mockWebSocketProvider(WebSocketClassProvider)
    }

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'
    process.env.WS_SUBSCRIPTION_TTL = '300'

    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    process.env = oldEnv
    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('iex endpoint', () => {
    const jobID = '1'

    it('should return success', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          endpoint: 'iex',
          base: 'aapl',
        },
      }

      let flowFulfilled: Promise<boolean>
      if (!process.env.RECORD) {
        mockResponseSuccess() // For the first response

        flowFulfilled = mockWebSocketFlow(mockedWsServer, [
          mockIexSubscribeResponse,
          mockIexUnsubscribeResponse,
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
      await util.sleep(100)
      const response = await makeRequest()

      expect(response.body).toEqual({
        jobRunID: '1',
        result: 170.28,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 170.28 },
      })

      await flowFulfilled
    }, 30000)
  })
})
