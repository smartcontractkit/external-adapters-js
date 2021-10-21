import { AdapterRequest } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import http from 'http'
import nock from 'nock'
import request from 'supertest'
import { server as startServer } from '../../src/index'
import { mockCryptoEndpoint } from './cryptoFixtures'

describe('coinapi', () => {
  let server: http.Server
  const oldEnv: NodeJS.ProcessEnv = JSON.parse(JSON.stringify(process.env))
  const req = request('localhost:8080')

  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'

    if (util.parseBool(process.env.RECORD)) {
      nock.recorder.rec()
    } else {
      process.env.API_KEY = 'mock-api-key'
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

  describe('crypto endpoint', () => {
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
        mockCryptoEndpoint()
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
})
