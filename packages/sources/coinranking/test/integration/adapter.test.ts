import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import {
  mockCryptoResponseFailure,
  mockCryptoResponseSuccess,
  mockReferenceCurrenciesSuccess,
} from './fixtures'

describe('execute', () => {
  const id = '1'
  let server: http.Server
  const req = request('localhost:8080')
  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'
    process.env.API_KEY = process.env.API_KEY || 'fake-api-key'
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

  describe('crypto api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'ETH',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockCryptoResponseSuccess()

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

  describe('marketcap api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        endpoint: 'marketcap',
        base: 'ETH',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockReferenceCurrenciesSuccess()
      mockCryptoResponseSuccess()

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

  describe('crypto api with invalid base', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'non-existing',
        quote: 'USD',
      },
    }

    it('should return failure', async () => {
      mockReferenceCurrenciesSuccess()
      mockCryptoResponseFailure()

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
})
