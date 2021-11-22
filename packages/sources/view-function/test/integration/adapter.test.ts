import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import { mockContractCallResponseSuccess } from './fixtures'
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

  describe('function call', () => {
    const data: AdapterRequest = {
      id,
      data: {
        contract: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        function: 'function symbol() view returns (string)',
      },
    }

    it('should return success', async () => {
      mockContractCallResponseSuccess()

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
