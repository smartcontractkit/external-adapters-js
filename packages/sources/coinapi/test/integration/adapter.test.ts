import { AdapterRequest } from '@chainlink/types'
import http from 'http'
import nock from 'nock'
import request from 'supertest'
import { server as startServer } from '../../src/index'
import { mockCryptoEndpointFailure, mockCryptoEndpointSuccess } from './cryptoFixtures'

let oldEnv: NodeJS.ProcessEnv

describe('coinmarketcap', () => {
  let server: http.Server
  const req = request('localhost:8080')

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.CACHE_ENABLED = 'false'
    process.env.API_KEY = process.env.API_KEY || 'mock-api-key'
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

  describe('coinapi crypto endpoint', () => {
    describe('when sending well-formed request', () => {
      it('should reply with success', async () => {
        const cryptoRequest: AdapterRequest = {
          id: '1',
          data: {
            endpoint: 'crypto',
            base: 'ETH',
            quote: 'BTC',
          },
        }
        mockCryptoEndpointSuccess()
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

    describe('when sending request without quote asset', () => {
      it('should reply with failure', async () => {
        const cryptoRequest: AdapterRequest = {
          id: '1',
          data: {
            endpoint: 'crypto',
            base: 'ETH',
          },
        }
        mockCryptoEndpointFailure()
        const response = await req
          .post('/')
          .send(cryptoRequest)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(400)
        expect(response.body).toMatchSnapshot()
      })
    })
  })
})
