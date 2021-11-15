import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import { mockBalanceResponse, mockBlockResponse } from './fixtures'

describe('execute', () => {
  let server: http.Server
  const req = request('localhost:8080')
  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'
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
        addresses: [
          {
            address: '3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1',
            coin: 'btc',
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

  describe('block endpoint', () => {
    const blockRequest: AdapterRequest = {
      id: '1',
      data: {
        endpoint: 'difficulty',
      },
    }

    it('should return success', async () => {
      mockBlockResponse()

      const response = await req
        .post('/')
        .send(blockRequest)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200)
      expect(response.body).toMatchSnapshot()
    })
  })
})
