import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import { mockPriceResponse } from './fixtures'

describe('dxfeed secondary', () => {
  const id = '1'
  let server: http.Server
  const req = request('localhost:8080')
  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'
    process.env.API_USERNAME = process.env.API_USERNAME || 'fake-api-username'
    process.env.API_PASSWORD = process.env.API_PASSWORD || 'fake-api-password'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    server = await startServer()
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

  describe('price endpoint', () => {
    const priceRequest: AdapterRequest = {
      id,
      data: {
        base: 'FTSE',
      },
    }

    it('should return success', async () => {
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
