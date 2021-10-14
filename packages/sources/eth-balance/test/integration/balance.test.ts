import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockETHBalanceResponseSuccess } from './fixtures'
import * as nock from 'nock'
import * as http from 'http'

beforeAll(() => {
  process.env.CACHE_ENABLED = 'false'
  process.env.RPC_URL = process.env.RPC_URL || 'http://localhost:8545'
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  if (process.env.RECORD) {
    nock.recorder.play()
  }

  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('execute', () => {
  const id = '1'
  let server: http.Server
  const req = request('localhost:8080')
  beforeAll(async () => {
    server = await startServer()
    process.env.CACHE_ENABLED = 'false'
  })
  afterAll((done) => {
    server.close(done)
  })

  describe('with single address', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [{ address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' }],
      },
    }

    it('should return success', async () => {
      mockETHBalanceResponseSuccess()

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

  describe('with multiple addresses', () => {
    const data: AdapterRequest = {
      id,
      data: {
        result: [
          { address: '0xEF9FFcFbeCB6213E5903529c8457b6F61141140d' },
          { address: '0x6a1544F72A2A275715e8d5924e6D8A017F0e41ed' },
        ],
      },
    }

    it('should return success', async () => {
      mockETHBalanceResponseSuccess()

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
})
