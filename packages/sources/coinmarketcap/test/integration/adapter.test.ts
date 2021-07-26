import { AdapterRequest } from '@chainlink/types'
import http from 'http'
import nock from 'nock'
import request from 'supertest'
import { server as startServer } from '../../src/index'
import { mockSuccessfulCoinMarketCapResponse, mockCoinMarketCapErrorTooManyRequests, mockSuccessfulCoinMarketCapResponseWithSlug } from './cryptoFixtures'
import { mockFailedGloalMetricsResponse, mockSuccessfulGlobalMetricsResponse } from './globalMetricsFixtures'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.API_KEY = process.env.API_KEY || "mock-api-key"
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

describe('coinmarketcap', () => {
  let server: http.Server
  const req = request('localhost:8080')

  beforeAll(async () => {
    server = await startServer()
  })
  afterAll((done) => server.close(done))

  describe('when making a request to coinmarket cap to globalmarketcap endpoint', () => {
    const globalMarketCap: AdapterRequest = {
      "id": "1",
      "data": {
        "endpoint": "globalmarketcap",
        "market": "USD"
      }
    }
    
    describe('coinmarketcap replies with success', () => {
      it('should reply with success', async () => {
        mockSuccessfulGlobalMetricsResponse("USD")
        const response = await req
            .post('/')
            .send(globalMarketCap)
            .set('Accept', '*/*')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
        expect(response.body).toMatchSnapshot()
      })
    })

    describe('coinmarketcap replies with error due to too many requests', () => {
      it('should reply with failure', async () => {
          // Fail 3 times to mimic retries
          mockFailedGloalMetricsResponse("USD")
          mockFailedGloalMetricsResponse("USD")
          mockFailedGloalMetricsResponse("USD")

          const response = await req
              .post('/')
              .send(globalMarketCap)
              .set('Accept', '*/*')
              .set('Content-Type', 'application/json')
              .expect('Content-Type', /json/)
              .expect(500)
          expect(response.body).toMatchSnapshot()
      })
    })
  })

  describe('when making a request to coinmarket cap to dominance endpoint', () => {
    const dominanceData: AdapterRequest = {
      "id": "1",
      "data": {
        "endpoint": "dominance",
        "market": "BTC"
      }
    }
    
    describe('coinmarketcap replies with success', () => {
      it('should reply with success', async () => {
        mockSuccessfulGlobalMetricsResponse()
        const response = await req
            .post('/')
            .send(dominanceData)
            .set('Accept', '*/*')
            .set('Content-Type', 'application/json')
            .expect('Content-Type', /json/)
            .expect(200)
        expect(response.body).toMatchSnapshot()
      })
    })

    describe('coinmarketcap replies with error due to too many requests', () => {
      it('should reply with failure', async () => {
          // Fail 3 times to mimic retries
          mockFailedGloalMetricsResponse()
          mockFailedGloalMetricsResponse()
          mockFailedGloalMetricsResponse()

          const response = await req
              .post('/')
              .send(dominanceData)
              .set('Accept', '*/*')
              .set('Content-Type', 'application/json')
              .expect('Content-Type', /json/)
              .expect(500)
          expect(response.body).toMatchSnapshot()
      })
    })
  })
    
  describe('when making a request to coinmarket cap crypto endpoint', () => {
    const data: AdapterRequest = {
        "id": "1",
        "data": {
          "endpoint": "crypto",
          "base": "BTC",
          "quote": "USD"
        }
    }

    describe('coinmarketcap replies with success', () => {
      it('should reply with success', async () => {
        mockSuccessfulCoinMarketCapResponse()

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

    describe('coinmarketcap replies with error due to too many requests', () => {
      it('should reply with failure', async () => {
          // Fail 3 times to mimic retries
          mockCoinMarketCapErrorTooManyRequests()
          mockCoinMarketCapErrorTooManyRequests()
          mockCoinMarketCapErrorTooManyRequests()

          const response = await req
              .post('/')
              .send(data)
              .set('Accept', '*/*')
              .set('Content-Type', 'application/json')
              .expect('Content-Type', /json/)
              .expect(500)
          expect(response.body).toMatchSnapshot()
      })
    })

    describe("coinmarketcap replies with success when cid passed in", () => {
      const cid = "1100"
      const dataWithCid: AdapterRequest = {
          "id": "1",
          "data": {
            "endpoint": "crypto",
            "base": "BTC",
            "quote": "USD",
            "cid": cid
          },
      }
      it('should reply with success', async () => {
          mockSuccessfulCoinMarketCapResponse(cid)
  
          const response = await req
              .post('/')
              .send(dataWithCid)
              .set('Accept', '*/*')
              .set('Content-Type', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
          expect(response.body).toMatchSnapshot()
      })
    })

    describe("coinmarketcap replies with success when slug passed in", () => {
      const slug = "BTC"
      const dataWithSlug: AdapterRequest = {
          "id": "1",
          "data": {
            "endpoint": "crypto",
            "base": "BTC",
            "quote": "USD",
            "slug": slug
          },
      }
      it('should reply with success', async () => {
          mockSuccessfulCoinMarketCapResponseWithSlug(slug)
  
          const response = await req
              .post('/')
              .send(dataWithSlug)
              .set('Accept', '*/*')
              .set('Content-Type', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
          expect(response.body).toMatchSnapshot()
      })
    })

    describe("coinmarketcap replies with success when single symbol passed in", () => {
      const slug = "bitcoin"
      const dataWithSlug: AdapterRequest = {
          "id": "1",
          "data": {
            "endpoint": "crypto",
            "base": "BTC",
            "quote": "USD",
            "symbol": slug
          },
      }
      it('should reply with success', async () => {
          mockSuccessfulCoinMarketCapResponse()
  
          const response = await req
              .post('/')
              .send(dataWithSlug)
              .set('Accept', '*/*')
              .set('Content-Type', 'application/json')
              .expect('Content-Type', /json/)
              .expect(200)
          expect(response.body).toMatchSnapshot()
      })
    })
  })
})
