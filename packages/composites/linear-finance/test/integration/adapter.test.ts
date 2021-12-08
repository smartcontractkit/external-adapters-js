import { AdapterRequest } from '@chainlink/types'
import request from 'supertest'
import * as process from 'process'
import { server as startServer } from '../../src'
import * as nock from 'nock'
import * as http from 'http'
import { mockAdapterResponseSuccess } from './fixtures'

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: any
  beforeAll(async () => {
    process.env.CACHE_ENABLED = 'false'
    process.env.COINMARKETCAP_ADAPTER_URL =
      process.env.COINMARKETCAP_ADAPTER_URL || 'http://localhost:8082'
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

  describe('xbci api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        index: 'xbci',
        quote: 'USD',
        source: 'coinmarketcap',
      },
    }

    it('should return success', async () => {
      mockAdapterResponseSuccess()

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

  describe('xlci api', () => {
    const data: AdapterRequest = {
      id,
      data: {
        index: 'xlci',
        quote: 'USD',
        source: 'coinmarketcap',
      },
    }

    it('should return success', async () => {
      mockAdapterResponseSuccess()

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
