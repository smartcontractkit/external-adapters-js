import { AdapterRequest } from '@chainlink/types'
import http from 'http'
import nock from 'nock'
import request from 'supertest'
import { server as startServer } from '../../src'
import {
  mockAuthTokenResponse,
  mockBtcCoinEndpoint,
  mockBtcMarketEndpoint,
  mockCryptoResponse,
  mockEthCoinEndpoint,
  mockEthMarketEndpoint,
} from './cryptoFixtures'
import { mockEthOhlcvEndpoint, mockVwapResponse } from './vwapFixtures'

let oldEnv: NodeJS.ProcessEnv

describe('bravenewcoin', () => {
  let server: http.Server
  const req = request('localhost:8080')

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.CACHE_ENABLED = 'false'
    process.env.API_KEY = process.env.API_KEY || 'mock-api-key'
    process.env.CLIENT_ID = process.env.CLIENT_ID || 'mock-client-id'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    server = await startServer()
  })
  afterAll((done) => {
    process.env = oldEnv
    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('when making a request to bravenewcoin to crypto endpoint', () => {
    const cryptoRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'crypto',
        base: 'ETH',
        quote: 'BTC',
      },
    }

    describe('bravenewcoin replies with success', () => {
      it('should reply with success', async () => {
        mockAuthTokenResponse()
        mockBtcCoinEndpoint()
        mockBtcMarketEndpoint()
        mockCryptoResponse()
        mockEthCoinEndpoint()
        mockEthMarketEndpoint()
        const response = await req
          .post('/')
          .send(cryptoRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body).toMatchSnapshot()
      })
    })
  })

  describe('when making a request to bravenewcoin to vwap endpoint', () => {
    const vwapRequest: AdapterRequest = {
      id: '2',
      data: {
        endpoint: 'vwap',
        base: 'ETH',
      },
    }

    describe('bravenewcoin replies with success', () => {
      it('should reply with success', async () => {
        mockAuthTokenResponse()
        mockEthCoinEndpoint()
        mockEthOhlcvEndpoint()
        mockVwapResponse()
        const response = await req
          .post('/')
          .send(vwapRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body).toMatchSnapshot()
      })
    })
  })
})
