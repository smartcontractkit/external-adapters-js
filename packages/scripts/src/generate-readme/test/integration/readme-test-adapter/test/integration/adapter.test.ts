import { AdapterRequest } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import http from 'http'
import nock from 'nock'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src/index'
import { mockBalanceResponse, mockMarketcapResponse, mockPriceResponse } from './fixtures'
import { AddressInfo } from 'net'

let oldEnv: NodeJS.ProcessEnv

describe('readme test adapter', () => {
  let server: http.Server
  let req: SuperTest<Test>

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.CACHE_ENABLED = 'false'
    process.env.API_KEY = process.env.API_KEY || 'mock-api-key'
    if (util.parseBool(process.env.RECORD)) {
      nock.recorder.rec()
    }
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
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
          coinid: 1,
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
          coinid: 2,
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
          amount: 1,
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
          amount: 10,
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
