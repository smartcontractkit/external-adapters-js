import { AdapterRequest } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'
import http from 'http'
import nock from 'nock'
import request from 'supertest'
import { server as startServer } from '../../src'
import { mockPriceEndpoint } from './fixtures'

describe('dxfeed', () => {
  let server: http.Server
  const oldEnv: NodeJS.ProcessEnv = JSON.parse(JSON.stringify(process.env))
  const req = request('localhost:8080')

  beforeAll(async () => {
    server = await startServer()
    process.env.CACHE_ENABLED = 'false'

    process.env.API_KEY = process.env.API_KEY || 'test-api-key'
    process.env.CLIENT_ID = process.env.CLIENT_ID || 'test-client-id'

    if (util.parseBool(process.env.RECORD)) {
      nock.recorder.rec()
    }
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

  describe('price endpoint', () => {
    const priceRequest: AdapterRequest = {
      id: '1',
      data: {
        base: 'FTSE',
      },
    }

    it('should reply with success', async () => {
      mockPriceEndpoint()
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
