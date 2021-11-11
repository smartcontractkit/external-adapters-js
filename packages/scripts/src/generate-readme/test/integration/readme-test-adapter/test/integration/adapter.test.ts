import { AdapterRequest } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import http from 'http'
import nock from 'nock'
import request from 'supertest'
import { server as startServer } from '../../src/index'
import { mockBalanceResponse, mockMarketcapResponse, mockPriceResponse } from './fixtures'

let oldEnv: NodeJS.ProcessEnv

describe('readme test adapter', () => {
  let server: http.Server
  const req = request('localhost:8080')

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.CACHE_ENABLED = 'false'
    process.env.API_KEY = process.env.API_KEY || 'mock-api-key'
    if (util.parseBool(process.env.RECORD)) {
      nock.recorder.rec()
    }
    server = await startServer()
  })
  afterAll((done) => {
    process.env = oldEnv
    if (util.parseBool(process.env.RECORD)) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('balance endpoint', () => {
    it('should reply with success', async () => {
      const balanceRequest: AdapterRequest = {
        id: '1',
        data: {
          endpoint: 'balance',
          addresses: [{ address: '3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1' }],
          dataPath: 'addresses',
        },
      }

      mockBalanceResponse()
      const response = await req
        .post('/')
        .send(balanceRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('marketcap endpoint', () => {
    it('should reply with success', async () => {
      const marketcapRequest: AdapterRequest = {
        id: '1',
        data: {
          coin: 'BTC',
          market: 'USD',
          endpoint: 'marketcap',
          coinid: 'Bitcoin',
        },
      }

      mockMarketcapResponse()
      const response = await req
        .post('/')
        .send(marketcapRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('should reply with success when called with `mc`', async () => {
      const mcRequest: AdapterRequest = {
        id: '1',
        data: {
          coin: 'BTC',
          market: 'USD',
          endpoint: 'mc',
          coinid: 'Bitcoin',
        },
      }

      mockMarketcapResponse()
      const response = await req
        .post('/')
        .send(mcRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('price endpoint', () => {
    it('should reply with success', async () => {
      const priceRequest: AdapterRequest = {
        id: '1',
        data: {
          base: 'BTC',
          quote: 'USD',
          endpoint: 'price',
        },
      }

      mockPriceResponse()
      const response = await req
        .post('/')
        .send(priceRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })

    it('should reply with success when called with `convert`', async () => {
      const priceRequest: AdapterRequest = {
        id: '1',
        data: {
          base: 'BTC',
          quote: 'USD',
          endpoint: 'convert',
        },
      }

      mockPriceResponse()
      const response = await req
        .post('/')
        .send(priceRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
