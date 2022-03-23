import { AdapterRequest } from '@chainlink/types'
import request, { SuperTest, Test } from 'supertest'
import process from 'process'
import nock from 'nock'
import http from 'http'
import { server as startServer } from '../../src'
import {
  mockSubscribeResponse,
  mockUnsubscribeResponse,
  mockWootradeResponseSuccess,
} from './fixtures'
import { DEFAULT_BASE_URL } from '../../src/config'
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

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.API_ENDPOINT = process.env.API_ENDPOINT || DEFAULT_BASE_URL
  process.env.API_VERBOSE = 'true'
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  process.env = oldEnv
  if (process.env.RECORD) {
    nock.recorder.play()
  }

  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
    process.env.CACHE_ENABLED = 'false'
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('with token', () => {
    const data: AdapterRequest = {
      id: '1',
      data: {
        base: 'ETH',
        quote: 'USDT',
      },
    }

    it('should return success', async () => {
      mockWootradeResponseSuccess()

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
      process.env.CACHE_ENABLED = 'true'
      process.env.API_KEY = process.env.API_KEY || 'fake-api-key'
      mockedWsServer = mockWebSocketServer(`${DEFAULT_WS_API_ENDPOINT}/${process.env.API_KEY}`)
      mockWebSocketProvider(WebSocketClassProvider)
    }

    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.WS_ENABLED = 'true'
    process.env.WS_SUBSCRIPTION_TTL = '100'

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

  describe('WS crypto endpoint', () => {
    const jobID = '1'

    it('should return success', async () => {
      const data: AdapterRequest = {
        id: jobID,
        data: {
          base: 'ETH',
          quote: 'USDT',
        },
      }

      let flowFulfilled: Promise<boolean>
      if (!process.env.RECORD) {
        mockWootradeResponseSuccess() // For the first response

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
      await util.sleep(50)
      const response = await makeRequest()

      expect(response.body).toEqual({
        jobRunID: '1',
        result: 2907.395,
        statusCode: 200,
        maxAge: 30000,
        data: { result: 2907.395 },
      })

      await flowFulfilled
    }, 30000)
  })
})
