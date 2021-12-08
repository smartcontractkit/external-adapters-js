import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import { mockResponseSuccess } from './fixtures'

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: any
  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'
    process.env.API_CLIENT_KEY = process.env.API_CLIENT_KEY || 'fake-api-key'
    process.env.API_CLIENT_SECRET = process.env.API_CLIENT_SECRET || 'fake-api-secret'
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
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

  describe('symbol api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        base: 'EURUSD:CUR',
      },
    }

    it('should return success', async () => {
      mockResponseSuccess()

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
