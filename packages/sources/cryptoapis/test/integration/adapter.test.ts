import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import { mockBalanceResponse, mockBcInfoResponse, mockCryptoResponse } from './fixtures'

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

  describe('balance endpoint', () => {
    const balanceRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'balance',
        addresses: [
          {
            address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
            chain: 'testnet',
          },
        ],
        dataPath: 'addresses',
      },
    }

    it('should return success', async () => {
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

  describe('bc_info endpoint', () => {
    const bcInfoRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'difficulty',
        blockchain: 'BTC',
      },
    }

    it('should return success', async () => {
      mockBcInfoResponse()

      const response = await req
        .post('/')
        .send(bcInfoRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })

  describe('crypto endpoint', () => {
    const cryptoRequest: AdapterRequest = {
      id: '1',
      data: {
        base: 'BTC',
        quote: 'USD',
      },
    }

    it('should return success', async () => {
      mockCryptoResponse()

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
